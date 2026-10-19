import { Resend } from 'resend';
import {
  renderBookingConfirmationEmail,
  renderReminder24hEmail,
  renderReminder2hEmail,
  renderCancellationEmail,
  type EmailBookingData,
} from '@/lib/email-templates';

// ============================================================================
// Email Service (Resend + Local Dev Fallback)
// ============================================================================

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

function getResendClient(): { client: Resend | null; fromEmail: string } {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'NoShowGuard <onboarding@resend.dev>';

  if (apiKey && !apiKey.includes('your-resend-api-key') && apiKey.startsWith('re_')) {
    return { client: new Resend(apiKey), fromEmail };
  }

  return { client: null, fromEmail };
}

async function sendEmailInternal({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendEmailResult> {
  const { client, fromEmail } = getResendClient();

  // If live Resend client is configured, send through API
  if (client) {
    try {
      const response = await client.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text,
      });

      if (response.error) {
        console.error('Resend API error:', response.error);
        return { success: false, error: response.error.message };
      }

      return { success: true, id: response.data?.id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send email';
      console.error('Resend send exception:', err);
      return { success: false, error: msg };
    }
  }

  // Development Fallback: Log to console
  const devId = `dev-email-${crypto.randomUUID()}`;
  console.log(`\n📧 [DEV EMAIL SENT]`);
  console.log(`  To: ${to}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  ID: ${devId}`);
  console.log(`  Preview text:\n  ${text.split('\n').slice(0, 5).join('\n  ')}\n`);

  return { success: true, id: devId };
}

export async function sendBookingConfirmationEmail(
  data: EmailBookingData
): Promise<SendEmailResult> {
  const { subject, html, text } = renderBookingConfirmationEmail(data);
  return sendEmailInternal({
    to: data.customerEmail,
    subject,
    html,
    text,
  });
}

export async function sendReminder24hEmail(
  data: EmailBookingData
): Promise<SendEmailResult> {
  const { subject, html, text } = renderReminder24hEmail(data);
  return sendEmailInternal({
    to: data.customerEmail,
    subject,
    html,
    text,
  });
}

export async function sendReminder2hEmail(
  data: EmailBookingData
): Promise<SendEmailResult> {
  const { subject, html, text } = renderReminder2hEmail(data);
  return sendEmailInternal({
    to: data.customerEmail,
    subject,
    html,
    text,
  });
}

export async function sendCancellationEmail(
  data: EmailBookingData
): Promise<SendEmailResult> {
  const { subject, html, text } = renderCancellationEmail(data);
  return sendEmailInternal({
    to: data.customerEmail,
    subject,
    html,
    text,
  });
}
