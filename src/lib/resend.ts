import { Resend } from 'resend';

// ============================================================================
// Resend Client
// ============================================================================

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NoShowGuard <onboarding@resend.dev>';
