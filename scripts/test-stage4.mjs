// Automated test suite for Stage 4: Public Customer Booking & Double-Booking Prevention

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- Starting Stage 4 Automated Tests ---');

  // 1. Fetch availability for apex-tutoring
  console.log('\n[1] Testing GET /api/availability ...');
  const serviceId = '00000000-0000-0000-0000-000000000011'; // 1-on-1 Calculus Tutoring
  const businessId = '00000000-0000-0000-0000-000000000001';

  // Find a weekday in future (e.g. 5 days from today)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  // Ensure it's a weekday (1 to 5)
  while (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  const dateStr = targetDate.toISOString().split('T')[0];
  console.log(`Target date: ${dateStr} (Day of week: ${targetDate.getDay()})`);

  const availRes = await fetch(
    `${baseUrl}/api/availability?slug=apex-tutoring&service_id=${serviceId}&date=${dateStr}`
  );
  const availData = await availRes.json();

  if (!availRes.ok || !availData.success) {
    throw new Error(`GET /api/availability failed: ${JSON.stringify(availData)}`);
  }

  console.log(`✓ GET /api/availability returned ${availData.slots.length} available slots for ${dateStr}`);
  if (availData.slots.length === 0) {
    throw new Error('Expected at least one available slot on a weekday.');
  }

  const testSlot = availData.slots[0];
  console.log(`Selected slot: ${testSlot.local_start_time} - ${testSlot.local_end_time} (${testSlot.starts_at_utc} UTC)`);

  // 2. Test booking a valid slot
  console.log('\n[2] Testing POST /api/bookings with valid data ...');
  const validBookingPayload = {
    business_id: businessId,
    service_id: serviceId,
    customer_name: 'Jane Doe',
    customer_email: 'jane.doe@example.com',
    customer_phone: '+15551234567',
    starts_at_utc: testSlot.starts_at_utc,
  };

  const bookRes1 = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validBookingPayload),
  });
  const bookData1 = await bookRes1.json();

  if (bookRes1.status !== 201 || !bookData1.success) {
    throw new Error(`POST /api/bookings failed: ${JSON.stringify(bookData1)}`);
  }
  console.log(`✓ Valid booking created successfully! ID: ${bookData1.booking_id}`);
  console.log(`✓ Confirmation token: ${bookData1.confirmation_token}`);
  console.log(`✓ Stored UTC: ${bookData1.starts_at_utc} to ${bookData1.ends_at_utc}`);

  // 3. Attempt to book the EXACT SAME SLOT twice (Double-booking test)
  console.log('\n[3] Testing Double-Booking Prevention (booking same slot again) ...');
  const duplicatePayload = {
    business_id: businessId,
    service_id: serviceId,
    customer_name: 'Bob Smith',
    customer_email: 'bob.smith@example.com',
    customer_phone: '+15559876543',
    starts_at_utc: testSlot.starts_at_utc,
  };

  const bookRes2 = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duplicatePayload),
  });
  const bookData2 = await bookRes2.json();

  if (bookRes2.status === 409) {
    console.log(`✓ Double-booking rejected with HTTP 409 Conflict! Error: "${bookData2.error}"`);
  } else {
    throw new Error(`Expected HTTP 409 Conflict for double-booking, got ${bookRes2.status}: ${JSON.stringify(bookData2)}`);
  }

  // Verify that the booked slot is now excluded from GET /api/availability
  console.log('\n[4] Verifying booked slot is excluded from future availability ...');
  const availResAfter = await fetch(
    `${baseUrl}/api/availability?slug=apex-tutoring&service_id=${serviceId}&date=${dateStr}`
  );
  const availDataAfter = await availResAfter.json();
  const slotStillExists = availDataAfter.slots.some(
    (s) => s.starts_at_utc === testSlot.starts_at_utc
  );

  if (slotStillExists) {
    throw new Error('Booked slot was still returned in available slots!');
  }
  console.log('✓ Confirmed: Booked slot is no longer present in available slots list.');

  // 5. Test invalid inputs
  console.log('\n[5] Testing Validation Errors ...');

  // Test A: Name too short
  const resBadName = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...validBookingPayload, customer_name: 'A' }),
  });
  const dataBadName = await resBadName.json();
  console.log(`✓ Short name rejected (status ${resBadName.status}): "${dataBadName.error}"`);
  if (resBadName.status !== 400) throw new Error('Expected 400 for short name');

  // Test B: Invalid email
  const resBadEmail = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...validBookingPayload, customer_email: 'not-an-email' }),
  });
  const dataBadEmail = await resBadEmail.json();
  console.log(`✓ Invalid email rejected (status ${resBadEmail.status}): "${dataBadEmail.error}"`);
  if (resBadEmail.status !== 400) throw new Error('Expected 400 for invalid email');

  // Test C: Past time
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  const resPastTime = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...validBookingPayload,
      customer_email: 'future@example.com',
      starts_at_utc: pastDate.toISOString(),
    }),
  });
  const dataPastTime = await resPastTime.json();
  console.log(`✓ Past appointment rejected (status ${resPastTime.status}): "${dataPastTime.error}"`);
  if (resPastTime.status !== 400) throw new Error('Expected 400 for past appointment');

  // Test D: Invalid service ID
  const resBadService = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...validBookingPayload,
      customer_email: 'test@example.com',
      service_id: '00000000-0000-0000-0000-999999999999',
    }),
  });
  const dataBadService = await resBadService.json();
  console.log(`✓ Non-existent service rejected (status ${resBadService.status}): "${dataBadService.error}"`);
  if (resBadService.status !== 400) throw new Error('Expected 400 for non-existent service');

  // 6. Test confirmation page
  console.log('\n[6] Testing Confirmation Page ...');
  const confirmRes = await fetch(
    `${baseUrl}/book/apex-tutoring/confirmation?token=${bookData1.confirmation_token}`
  );
  if (confirmRes.ok) {
    console.log(`✓ Confirmation page loaded successfully (status ${confirmRes.status})`);
  } else {
    throw new Error(`Confirmation page failed with status ${confirmRes.status}`);
  }

  console.log('\n========================================');
  console.log('🎉 ALL STAGE 4 TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
