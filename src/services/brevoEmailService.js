import { generateGitaInterestEmail } from '../templates/gitaInterestEmail.js';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Sends a transactional email notification via Brevo REST API
 * when a user expresses interest in a Gita Class.
 *
 * @param {Object} data - Interest request form data
 * @returns {Promise<Object>} Result of the Brevo API request
 */
export async function sendGitaInterestNotification(data) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'SoulSync';
  const adminEmailsRaw = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!apiKey) {
    console.warn('[BrevoService] BREVO_API_KEY is not configured. Email dispatch skipped.');
    return { success: false, reason: 'MISSING_API_KEY' };
  }

  if (apiKey.startsWith('xsmtpsib-')) {
    const errorMsg = 'BREVO_API_KEY appears to be an SMTP key (starts with "xsmtpsib-"). ' +
      'Brevo REST API requires an API key from the "API Keys" tab (starts with "xkeysib-"). ' +
      'Please generate an API key under Brevo Dashboard > Settings > SMTP & API > API Keys.';
    console.warn(`[BrevoService] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (!senderEmail) {
    console.warn('[BrevoService] BREVO_SENDER_EMAIL is not configured. Email dispatch skipped.');
    return { success: false, reason: 'MISSING_SENDER_EMAIL' };
  }

  if (!adminEmailsRaw) {
    console.warn('[BrevoService] ADMIN_NOTIFICATION_EMAIL is not configured. Email dispatch skipped.');
    return { success: false, reason: 'MISSING_ADMIN_EMAIL' };
  }

  const toList = adminEmailsRaw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .map((email) => ({ email }));

  if (toList.length === 0) {
    console.warn('[BrevoService] No valid recipient emails found in ADMIN_NOTIFICATION_EMAIL.');
    return { success: false, reason: 'NO_VALID_RECIPIENT' };
  }

  const userName = data.name || 'Interested Seeker';
  const subject = `New Gita Class Interest — ${userName}`;
  const htmlContent = generateGitaInterestEmail({
    ...data,
    adminPortalUrl: process.env.ADMIN_PORTAL_URL || 'https://soulsync-dev-host.web.app/admin/mandala',
  });

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: toList,
    subject,
    htmlContent,
  };

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log(`[BrevoService] Email sent successfully to admin(s). Message ID: ${result.messageId}`);
  return {
    success: true,
    messageId: result.messageId,
  };
}

export default {
  sendGitaInterestNotification,
};
