/**
 * Generates the HTML template for the Admin notification email
 * when a new Gita Class interest request is submitted.
 */
export function generateGitaInterestEmail({
  name,
  age,
  passion,
  institutionName,
  mode,
  language,
  preferredDay,
  email,
  phoneNumber,
  description = '',
  opportunityTitle = 'Bhagavad Gita Class',
  adminPortalUrl = 'https://soulsync-dev-host.web.app/admin/mandala',
}) {
  const normalizedPassion = (passion || 'STUDENT').toUpperCase();
  const displayName = (name || 'Anonymous').toUpperCase();
  const displayAge = age ? `${age} yrs` : 'Age not specified';
  const displayEmail = email ? `<a href="mailto:${email}" style="color: #2F4F4F; text-decoration: underline;">${email}</a>` : 'Not provided';
  const displayPhone = phoneNumber ? `<a href="tel:${phoneNumber}" style="color: #2F4F4F; text-decoration: underline; font-weight: 600;">${phoneNumber}</a>` : 'Not provided';

  let passionLabel = 'STUDENT';
  if (normalizedPassion === 'PROFESSIONAL') {
    passionLabel = 'PROFESSIONAL';
  } else if (normalizedPassion === 'OTHER') {
    passionLabel = 'OTHER';
  }

  const detailsLine = [
    mode || 'ONLINE',
    language || 'ENGLISH',
    `Day: ${preferredDay || 'SUNDAY'}`,
  ].join(' &bull; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Gita Class Interest — ${name || 'User'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background-color: #2F4F4F; padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">
                SoulSync
              </h1>
              <p style="margin: 6px 0 0 0; color: #d1e0dd; font-size: 14px; font-weight: 400;">
                ${opportunityTitle}
              </p>
            </td>
          </tr>

          <!-- Notification Title Banner -->
          <tr>
            <td style="padding: 24px 32px 12px 32px; border-bottom: 1px solid #f1f5f9;">
              <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.75px; padding: 4px 10px; border-radius: 999px; margin-bottom: 12px;">
                New Lead
              </span>
              <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 700; line-height: 1.3;">
                New Gita Class Interest
              </h2>
            </td>
          </tr>

          <!-- Main Details -->
          <tr>
            <td style="padding: 24px 32px;">
              <!-- Candidate Highlight -->
              <div style="background-color: #f8fafc; border-left: 4px solid #2F4F4F; padding: 18px 20px; border-radius: 8px; margin-bottom: 24px;">
                <div style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
                  ${displayName} (${displayAge})
                </div>
                <div style="font-size: 15px; color: #334155; font-weight: 600; margin-bottom: 8px;">
                  ${passionLabel}: <span style="font-weight: 500; color: #475569;">${institutionName || 'Not specified'}</span>
                </div>
                <div style="font-size: 14px; color: #059669; font-weight: 600;">
                  ${detailsLine}
                </div>
              </div>

              <!-- Contact Info Grid -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="padding-right: 12px; vertical-align: top;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; letter-spacing: 0.5px;">
                      Email
                    </div>
                    <div style="font-size: 15px; color: #1e293b;">
                      ${displayEmail}
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 12px; vertical-align: top;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; letter-spacing: 0.5px;">
                      Phone
                    </div>
                    <div style="font-size: 15px; color: #1e293b;">
                      ${displayPhone}
                    </div>
                  </td>
                </tr>
              </table>

              ${description ? `
              <!-- Optional Notes -->
              <div style="margin-bottom: 24px; padding: 14px 16px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #b45309; margin-bottom: 4px; letter-spacing: 0.5px;">
                  Notes / Questions
                </div>
                <div style="font-size: 14px; color: #78350f; line-height: 1.5;">
                  ${description}
                </div>
              </div>` : ''}

              <!-- Action Button -->
              <div style="text-align: center; margin-top: 32px; margin-bottom: 12px;">
                <a href="${adminPortalUrl}"
                   target="_blank"
                   style="display: inline-block; background-color: #2F4F4F; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(47, 79, 79, 0.25);">
                  View All Interested Users
                </a>
              </div>
              <div style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 10px;">
                Direct link: <a href="${adminPortalUrl}" style="color: #64748b;">${adminPortalUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                This notification was automatically sent by SoulSync when a user expressed interest in the Gita Class.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
