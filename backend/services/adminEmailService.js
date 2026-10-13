'use strict';

/** Optional admin email notifications via Resend HTTP API. Requires RESEND_API_KEY and a verified EMAIL_FROM sender. */
async function sendAdminNotification(subject, text) {
  const to = String(process.env.ADMIN_NOTIFICATION_EMAIL || 'spworldtechtechnology@gmail.com').trim();
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.EMAIL_FROM || '').trim();
  if (!apiKey || !from || !to) {
    console.warn('Admin email notification skipped: configure RESEND_API_KEY, EMAIL_FROM, and ADMIN_NOTIFICATION_EMAIL.');
    return { sent: false, reason: 'email_not_configured' };
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Admin email notification failed:', result.message || response.status);
      return { sent: false, reason: 'provider_error' };
    }
    return { sent: true, id: result.id || null };
  } catch (error) {
    console.error('Admin email notification failed:', error.message);
    return { sent: false, reason: 'network_error' };
  }
}

module.exports = { sendAdminNotification };
