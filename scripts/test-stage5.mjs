// Automated test suite for Stage 5: Transactional Emails & Reminder Automation

async function runStage5Tests() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- Starting Stage 5 Automated Tests ---');

  const businessId = '00000000-0000-0000-0000-000000000001';
  const serviceId = '00000000-0000-0000-0000-000000000011';

  // 1. Create a test booking 25 minutes in the future
  console.log('\n[1] Creating a test booking 25 minutes in the future ...');
  const now = new Date();
  const startsAt = new Date(now.getTime() + 25 * 60 * 1000); // 25 mins from now
  const startsAtUtc = startsAt.toISOString();

  console.log(`Current time: ${now.toISOString()}`);
  console.log(`Appointment start: ${startsAtUtc} (in 25 minutes)`);

  const createRes = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_id: businessId,
      service_id: serviceId,
      customer_name: 'Marcus Vance',
      customer_email: 'marcus.vance@example.com',
      customer_phone: '+15552345678',
      starts_at_utc: startsAtUtc,
    }),
  });

  const createData = await createRes.json();
  if (createRes.status !== 201 || !createData.success) {
    throw new Error(`Failed to create test booking: ${JSON.stringify(createData)}`);
  }

  const token = createData.confirmation_token;
  console.log(`✓ Test booking created: ID ${createData.booking_id}`);
  console.log(`✓ Confirmation token: ${token}`);

  // 2. Call the reminder endpoint manually
  console.log('\n[2] Triggering POST /api/cron/reminders manually ...');
  const cronRes1 = await fetch(`${baseUrl}/api/cron/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const cronData1 = await cronRes1.json();
  console.log('Cron response 1:', JSON.stringify(cronData1, null, 2));

  if (!cronRes1.ok || !cronData1.success) {
    throw new Error(`Cron reminders failed: ${JSON.stringify(cronData1)}`);
  }

  // The 25-minute appointment qualifies for both 24h and 2h reminders
  console.log(`✓ 24-hour reminders processed: ${cronData1.processed_24h}`);
  console.log(`✓ 2-hour reminders processed: ${cronData1.processed_2h}`);

  if (cronData1.processed_24h < 1 || cronData1.processed_2h < 1) {
    throw new Error('Expected both 24h and 2h reminders to be dispatched for 25m appointment.');
  }

  // 3. Verify emails are sent ONLY ONCE (Deduplication test)
  console.log('\n[3] Triggering POST /api/cron/reminders a SECOND time (deduplication check) ...');
  const cronRes2 = await fetch(`${baseUrl}/api/cron/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const cronData2 = await cronRes2.json();
  console.log('Cron response 2:', JSON.stringify(cronData2, null, 2));

  if (cronData2.processed_24h !== 0 || cronData2.processed_2h !== 0) {
    throw new Error(
      `Deduplication failed! Reminders were sent again: 24h=${cronData2.processed_24h}, 2h=${cronData2.processed_2h}`
    );
  }
  console.log('✓ Confirmed: 0 reminders sent on second run. Reminder timestamps prevented duplicate emails.');

  // 4. Test Customer Confirmation Action
  console.log('\n[4] Testing Customer Confirm Action via secure token ...');
  const confirmRes = await fetch(`${baseUrl}/api/bookings/${token}/confirm`, {
    method: 'POST',
  });
  const confirmData = await confirmRes.json();

  if (!confirmRes.ok || !confirmData.success) {
    throw new Error(`Confirm action failed: ${JSON.stringify(confirmData)}`);
  }
  console.log(`✓ Appointment confirmed: status="${confirmData.status}" - "${confirmData.message}"`);

  // 5. Test Customer Reschedule Request
  console.log('\n[5] Testing Customer Reschedule Request ...');
  const rescheduleRes = await fetch(`${baseUrl}/api/bookings/${token}/reschedule-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notes: 'Can we move our session to tomorrow at 3 PM instead?',
      preferred_times: 'Tomorrow 3:00 PM',
    }),
  });
  const rescheduleData = await rescheduleRes.json();

  if (!rescheduleRes.ok || !rescheduleData.success) {
    throw new Error(`Reschedule request failed: ${JSON.stringify(rescheduleData)}`);
  }
  console.log(`✓ Reschedule request received: "${rescheduleData.message}"`);

  // 6. Test Customer Cancellation Action
  console.log('\n[6] Testing Customer Cancel Action ...');
  const cancelRes = await fetch(`${baseUrl}/api/bookings/${token}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Schedule conflict with university exam' }),
  });
  const cancelData = await cancelRes.json();

  if (!cancelRes.ok || !cancelData.success) {
    throw new Error(`Cancel action failed: ${JSON.stringify(cancelData)}`);
  }
  console.log(`✓ Appointment cancelled: status="${cancelData.status}" - "${cancelData.message}"`);

  // 7. Verify booking management page loads with updated status
  console.log('\n[7] Verifying /booking/[token] page renders updated status ...');
  const pageRes = await fetch(`${baseUrl}/booking/${token}`);
  if (!pageRes.ok) {
    throw new Error(`/booking/[token] returned status ${pageRes.status}`);
  }
  const pageHtml = await pageRes.text();
  if (!pageHtml.includes('cancelled') && !pageHtml.includes('Cancelled')) {
    throw new Error('Expected booking management page to display cancelled status.');
  }
  console.log('✓ /booking/[token] rendered successfully with cancelled state.');

  console.log('\n========================================');
  console.log('🎉 ALL STAGE 5 TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runStage5Tests().catch((err) => {
  console.error('\n❌ Stage 5 Tests Failed:', err);
  process.exit(1);
});
