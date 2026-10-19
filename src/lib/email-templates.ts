import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

export interface EmailBookingData {
  businessName: string;
  businessType?: string;
  businessTimezone: string;
  serviceName: string;
  durationMinutes: number;
  price: number;
  customerName: string;
  customerEmail: string;
  startsAtUtc: string;
  endsAtUtc: string;
  cancellationPolicy: string | null;
  confirmationToken: string;
  appBaseUrl?: string;
}

function getBaseUrl(data: EmailBookingData): string {
  if (data.appBaseUrl) return data.appBaseUrl;
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  );
}

function formatAppointmentTimes(data: EmailBookingData) {
  const timeZone = data.businessTimezone || 'UTC';
  const start = parseISO(data.startsAtUtc);
  const end = parseISO(data.endsAtUtc);

  const formattedDate = formatInTimeZone(start, timeZone, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = formatInTimeZone(start, timeZone, 'h:mm a');
  const formattedEndTime = formatInTimeZone(end, timeZone, 'h:mm a');

  return { formattedDate, formattedStartTime, formattedEndTime, timeZone };
}

// ────────────────────────────────────────────────────────────────────────────
// Common Email Shell
// ────────────────────────────────────────────────────────────────────────────

function emailShell({
  title,
  preheader,
  headerBadge,
  bodyHtml,
  businessName,
}: {
  title: string;
  preheader: string;
  headerBadge?: string;
  bodyHtml: string;
  businessName: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f4f5; padding: 30px 10px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 32px 28px; text-align: left; color: #ffffff; }
    .header-badge { display: inline-block; padding: 4px 10px; background-color: rgba(255, 255, 255, 0.2); border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; line-height: 1.25; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 28px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .btn { display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 700; text-align: center; text-decoration: none; border-radius: 8px; margin: 6px 4px; }
    .btn-confirm { background-color: #16a34a; color: #ffffff !important; }
    .btn-cancel { background-color: #ffffff; color: #dc2626 !important; border: 1px solid #fca5a5; }
    .btn-reschedule { background-color: #ffffff; color: #4b5563 !important; border: 1px solid #d1d5db; }
    .footer { padding: 24px 28px; background-color: #fafafa; border-top: 1px solid #f4f4f5; font-size: 12px; color: #71717a; text-align: center; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <table class="wrapper" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table class="container" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td class="header">
              ${headerBadge ? `<div class="header-badge">${headerBadge}</div>` : ''}
              <h1>${businessName}</h1>
              <p>${title}</p>
            </td>
          </tr>
          <tr>
            <td class="content">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="footer">
              Sent on behalf of <strong>${businessName}</strong> via <strong>NoShowGuard</strong>.<br />
              Automated reminders protect your appointments from no-shows and scheduling conflicts.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Booking Confirmation Email
// ────────────────────────────────────────────────────────────────────────────

export function renderBookingConfirmationEmail(data: EmailBookingData): {
  subject: string;
  html: string;
  text: string;
} {
  const baseUrl = getBaseUrl(data);
  const { formattedDate, formattedStartTime, formattedEndTime, timeZone } =
    formatAppointmentTimes(data);

  const managementUrl = `${baseUrl}/booking/${data.confirmationToken}`;
  const confirmUrl = `${managementUrl}?action=confirm`;
  const cancelUrl = `${managementUrl}?action=cancel`;
  const rescheduleUrl = `${managementUrl}?action=reschedule`;

  const subject = `Confirmed: ${data.serviceName} with ${data.businessName}`;
  const preheader = `Your appointment is booked for ${formattedDate} at ${formattedStartTime} (${timeZone}).`;

  const bodyHtml = `
    <p style="font-size: 16px; margin: 0 0 16px;">Hi <strong>${data.customerName}</strong>,</p>
    <p style="font-size: 14px; color: #52525b; line-height: 1.5; margin: 0 0 20px;">
      Your appointment with <strong>${data.businessName}</strong> has been successfully booked! Here are your appointment details:
    </p>

    <div class="card">
      <div style="font-size: 12px; font-weight: 700; color: #4f46e5; text-transform: uppercase; margin-bottom: 6px;">Service Details</div>
      <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">${data.serviceName}</div>
      <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px; color: #334155;">
        <tr>
          <td width="30%" style="color: #64748b;">Date:</td>
          <td><strong>${formattedDate}</strong></td>
        </tr>
        <tr>
          <td style="color: #64748b;">Time:</td>
          <td><strong>${formattedStartTime} – ${formattedEndTime}</strong> (${timeZone})</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Duration:</td>
          <td>${data.durationMinutes} minutes</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Price:</td>
          <td><strong>${data.price > 0 ? `$${data.price.toFixed(2)}` : 'Free'}</strong></td>
        </tr>
      </table>
    </div>

    ${
      data.cancellationPolicy
        ? `
    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 12px; color: #92400e; line-height: 1.4;">
      <strong>Cancellation Policy:</strong> ${data.cancellationPolicy}
    </div>`
        : ''
    }

    <div style="text-align: center; margin: 28px 0 16px;">
      <p style="font-size: 13px; color: #64748b; margin-bottom: 14px;">Need to manage or verify your appointment?</p>
      <a href="${confirmUrl}" class="btn btn-confirm">Confirm Appointment</a>
      <a href="${rescheduleUrl}" class="btn btn-reschedule">Reschedule</a>
      <a href="${cancelUrl}" class="btn btn-cancel">Cancel</a>
    </div>

    <p style="font-size: 12px; color: #a1a1aa; text-align: center; margin-top: 16px;">
      You can also manage your booking at any time by visiting:<br />
      <a href="${managementUrl}" style="color: #4f46e5; word-break: break-all;">${managementUrl}</a>
    </p>
  `;

  const text = `
Appointment Confirmed with ${data.businessName}

Hi ${data.customerName},
Your appointment has been booked.

Service: ${data.serviceName}
Date: ${formattedDate}
Time: ${formattedStartTime} - ${formattedEndTime} (${timeZone})
Duration: ${data.durationMinutes} minutes
Price: ${data.price > 0 ? `$${data.price.toFixed(2)}` : 'Free'}

Manage your booking:
Confirm: ${confirmUrl}
Reschedule: ${rescheduleUrl}
Cancel: ${cancelUrl}
  `.trim();

  const html = emailShell({
    title: 'Appointment Confirmation',
    preheader,
    headerBadge: 'Booking Confirmed',
    bodyHtml,
    businessName: data.businessName,
  });

  return { subject, html, text };
}

// ────────────────────────────────────────────────────────────────────────────
// 2. 24-Hour Reminder Email
// ────────────────────────────────────────────────────────────────────────────

export function renderReminder24hEmail(data: EmailBookingData): {
  subject: string;
  html: string;
  text: string;
} {
  const baseUrl = getBaseUrl(data);
  const { formattedDate, formattedStartTime, formattedEndTime, timeZone } =
    formatAppointmentTimes(data);

  const managementUrl = `${baseUrl}/booking/${data.confirmationToken}`;
  const confirmUrl = `${managementUrl}?action=confirm`;
  const cancelUrl = `${managementUrl}?action=cancel`;
  const rescheduleUrl = `${managementUrl}?action=reschedule`;

  const subject = `Reminder: Tomorrow — ${data.serviceName} with ${data.businessName}`;
  const preheader = `Your appointment is tomorrow at ${formattedStartTime} (${timeZone}). Please confirm your attendance.`;

  const bodyHtml = `
    <p style="font-size: 16px; margin: 0 0 16px;">Hi <strong>${data.customerName}</strong>,</p>
    <p style="font-size: 14px; color: #52525b; line-height: 1.5; margin: 0 0 20px;">
      This is a friendly reminder that you have an appointment tomorrow with <strong>${data.businessName}</strong>.
    </p>

    <div class="card" style="border-left: 4px solid #4f46e5;">
      <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">${data.serviceName}</div>
      <div style="font-size: 15px; color: #1e293b; font-weight: 600;">
        Tomorrow: ${formattedDate}
      </div>
      <div style="font-size: 15px; color: #4f46e5; font-weight: 700; margin-top: 4px;">
        ${formattedStartTime} – ${formattedEndTime} (${timeZone})
      </div>
    </div>

    <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 20px 0;">
      Please take a moment to confirm if you will be attending. If your schedule has changed, please let us know as early as possible so we can accommodate others.
    </p>

    <div style="text-align: center; margin: 28px 0 16px;">
      <a href="${confirmUrl}" class="btn btn-confirm">Yes, I'll Be There (Confirm)</a><br />
      <a href="${rescheduleUrl}" class="btn btn-reschedule" style="margin-top: 10px;">Request Reschedule</a>
      <a href="${cancelUrl}" class="btn btn-cancel" style="margin-top: 10px;">Cannot Make It (Cancel)</a>
    </div>

    ${
      data.cancellationPolicy
        ? `
    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 12px; color: #92400e;">
      <strong>Cancellation Policy:</strong> ${data.cancellationPolicy}
    </div>`
        : ''
    }
  `;

  const text = `
Reminder: Your appointment with ${data.businessName} is tomorrow!

Hi ${data.customerName},
Your session for ${data.serviceName} is scheduled for:
${formattedDate} at ${formattedStartTime} (${timeZone}).

Please confirm or reschedule:
Confirm: ${confirmUrl}
Reschedule: ${rescheduleUrl}
Cancel: ${cancelUrl}
  `.trim();

  const html = emailShell({
    title: 'Appointment Tomorrow',
    preheader,
    headerBadge: '24-Hour Reminder',
    bodyHtml,
    businessName: data.businessName,
  });

  return { subject, html, text };
}

// ────────────────────────────────────────────────────────────────────────────
// 3. 2-Hour Final Reminder Email
// ────────────────────────────────────────────────────────────────────────────

export function renderReminder2hEmail(data: EmailBookingData): {
  subject: string;
  html: string;
  text: string;
} {
  const baseUrl = getBaseUrl(data);
  const { formattedDate, formattedStartTime, formattedEndTime, timeZone } =
    formatAppointmentTimes(data);

  const managementUrl = `${baseUrl}/booking/${data.confirmationToken}`;
  const confirmUrl = `${managementUrl}?action=confirm`;
  const cancelUrl = `${managementUrl}?action=cancel`;

  const subject = `Starting Soon (in 2 hours): ${data.serviceName} with ${data.businessName}`;
  const preheader = `Your appointment starts in 2 hours at ${formattedStartTime} (${timeZone}).`;

  const bodyHtml = `
    <p style="font-size: 16px; margin: 0 0 16px;">Hi <strong>${data.customerName}</strong>,</p>
    <p style="font-size: 14px; color: #52525b; line-height: 1.5; margin: 0 0 20px;">
      Your appointment with <strong>${data.businessName}</strong> starts in <strong>2 hours</strong>.
    </p>

    <div class="card" style="border-left: 4px solid #16a34a; background-color: #f0fdf4;">
      <div style="font-size: 12px; font-weight: 700; color: #16a34a; text-transform: uppercase;">Final Check-in</div>
      <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 6px 0;">${data.serviceName}</div>
      <div style="font-size: 15px; color: #15803d; font-weight: 700;">
        Today: ${formattedStartTime} – ${formattedEndTime} (${timeZone})
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0 16px;">
      <a href="${confirmUrl}" class="btn btn-confirm">I'm on My Way</a>
      <a href="${cancelUrl}" class="btn btn-cancel">Running Late / Cancel</a>
    </div>

    <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 20px;">
      If you are running late or have an emergency, please use the links above to let ${data.businessName} know immediately.
    </p>
  `;

  const text = `
Final Reminder: Appointment in 2 hours with ${data.businessName}

Hi ${data.customerName},
Your session for ${data.serviceName} starts at ${formattedStartTime} (${timeZone}).

Confirm: ${confirmUrl}
Cancel: ${cancelUrl}
  `.trim();

  const html = emailShell({
    title: 'Starting in 2 Hours',
    preheader,
    headerBadge: 'Final 2-Hour Reminder',
    bodyHtml,
    businessName: data.businessName,
  });

  return { subject, html, text };
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Cancellation Confirmation Email
// ────────────────────────────────────────────────────────────────────────────

export function renderCancellationEmail(data: EmailBookingData): {
  subject: string;
  html: string;
  text: string;
} {
  const baseUrl = getBaseUrl(data);
  const { formattedDate, formattedStartTime, timeZone } = formatAppointmentTimes(data);
  const bookingPageUrl = `${baseUrl}/book/${data.confirmationToken ? 'apex-tutoring' : ''}`;

  const subject = `Cancelled: Appointment with ${data.businessName}`;
  const preheader = `Your appointment for ${data.serviceName} on ${formattedDate} has been cancelled.`;

  const bodyHtml = `
    <p style="font-size: 16px; margin: 0 0 16px;">Hi <strong>${data.customerName}</strong>,</p>
    <p style="font-size: 14px; color: #52525b; line-height: 1.5; margin: 0 0 20px;">
      Your appointment for <strong>${data.serviceName}</strong> with <strong>${data.businessName}</strong> on <strong>${formattedDate} at ${formattedStartTime} (${timeZone})</strong> has been cancelled.
    </p>

    <div class="card" style="border-left: 4px solid #ef4444; background-color: #fef2f2;">
      <div style="font-size: 14px; font-weight: 700; color: #991b1b;">Status: Cancelled</div>
      <p style="font-size: 13px; color: #b91c1c; margin: 6px 0 0;">
        The time slot has been released and you will not receive any further reminders for this session.
      </p>
    </div>

    <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 20px 0;">
      Whenever you are ready to reschedule, you are welcome to book a new appointment:
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${baseUrl}" class="btn btn-confirm" style="background-color: #4f46e5;">Book Another Appointment</a>
    </div>
  `;

  const text = `
Appointment Cancelled

Hi ${data.customerName},
Your appointment for ${data.serviceName} with ${data.businessName} on ${formattedDate} at ${formattedStartTime} (${timeZone}) has been cancelled.

Whenever you're ready, you can book a new appointment at:
${baseUrl}
  `.trim();

  const html = emailShell({
    title: 'Appointment Cancelled',
    preheader,
    headerBadge: 'Cancelled',
    bodyHtml,
    businessName: data.businessName,
  });

  return { subject, html, text };
}
