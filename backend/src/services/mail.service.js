import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

/**
 * Format role name for presentation
 */
function formatRoleName(role) {
  switch (role) {
    case 'DEPARTMENT_OFFICER':
      return 'Department Officer';
    case 'FIELD_WORKER':
      return 'Field Maintenance Worker';
    case 'CITIZEN':
      return 'Citizen User';
    case 'SUPER_ADMIN':
      return 'Supervisor Admin';
    default:
      return role || 'Portal User';
  }
}

/**
 * Dispatch 6-digit password reset OTP email via SMTP
 */
export async function sendPasswordResetOtpEmail({
  toEmail,
  fullName = 'User',
  otpCode,
  role = 'CITIZEN',
  userCode
}) {
  if (!toEmail || !toEmail.includes('@')) {
    console.warn(`[MailService] No valid recipient email provided: ${toEmail}`);
    return false;
  }

  const roleLabel = formatRoleName(role);
  const fromAddress = process.env.SMTP_FROM || 'NagrikSeva Municipal Portal <santhoshkumarm.designer@gmail.com>';
  const subject = `🔐 [NagrikSeva] Your Password Reset OTP is ${otpCode}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP - NagrikSeva</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
          
          <!-- Government Branded Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 26px 32px; color: #ffffff;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; margin-bottom: 4px; font-weight: 600;">
                      Government Civic Redressal Portal
                    </div>
                    <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                      NagrikSeva • Account Security Desk
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">
                      AUTH VERIFICATION
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px;">
                Password Reset Authentication
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 20px;">
                Hello <strong>${fullName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                A password reset request was initiated for your <strong>${roleLabel}</strong> account 
                ${userCode ? `(ID: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-weight:700;">${userCode}</code>)` : ''}.
                Use the following 6-digit One-Time Password (OTP) to authenticate and choose your new password:
              </p>

              <!-- OTP Box -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background: #eff6ff; border: 2px dashed #93c5fd; border-radius: 12px; padding: 24px 16px;">
                    <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #1d4ed8; margin-bottom: 8px;">
                      Your One-Time Password (OTP)
                    </div>
                    <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1e3a8a; font-family: 'Courier New', Courier, monospace;">
                      ${otpCode}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                      Valid for <strong>10 minutes</strong> only
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;">
                  <strong>Security Advisory:</strong> For department officers, field maintenance staff, and citizens: do not disclose this OTP to anyone. Municipal supervisors and portal admins will never request your OTP.
                </p>
              </div>

              <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0;">
                If you did not request this password reset, you can safely disregard this email. Your existing password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #64748b; text-align: center;">
              <div>NagrikSeva Digital Municipal Governance System</div>
              <div style="margin-top: 4px; font-size: 11px; color: #94a3b8;">
                This is an automated security transmission. Please do not reply directly to this email.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const activeTransporter = getTransporter();
    const info = await activeTransporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html
    });

    console.log(`[MailService] ✉️ Password reset OTP email successfully sent to ${toEmail} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[MailService] ❌ Failed to send OTP email to ${toEmail}:`, error.message);
    // Dev fallback: display in console so nobody gets stuck
    console.log(`[MailService] [FALLBACK CONSOLE] OTP for ${toEmail} is: [ ${otpCode} ]`);
    return false;
  }
}

/**
 * Dispatch Department Officer Official Credentials Email via SMTP
 */
export async function sendDepartmentOfficerWelcomeEmail({
  toEmail,
  fullName = 'Department Officer',
  userCode,
  temporaryPassword,
  departmentName,
  departmentCode,
  loginUrl = 'http://localhost:5174/login?portal=officer'
}) {
  if (!toEmail || !toEmail.includes('@')) {
    console.warn(`[MailService] No valid recipient email provided: ${toEmail}`);
    return false;
  }

  const fromAddress = process.env.SMTP_FROM || 'NagrikSeva Municipal Portal <santhoshkumarm.designer@gmail.com>';
  const subject = `🏛️ [NagrikSeva] Official Access Credentials for ${departmentName} (${userCode})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Department Officer Credentials - NagrikSeva</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
          
          <!-- Government Branded Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 26px 32px; color: #ffffff;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; margin-bottom: 4px; font-weight: 600;">
                      Municipal Administration System
                    </div>
                    <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                      NagrikSeva • Department Portal Desk
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">
                      OFFICER ACCESS
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px;">
                Official Account Credentials Issued
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 16px;">
                Hello <strong>${fullName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                A new municipal wing <strong>${departmentName}</strong> (${departmentCode}) has been registered by the Super Admin Central Command. You have been designated as the Nodal Department Officer.
              </p>

              <!-- Credentials Box -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; display: block; margin-bottom: 4px;">Official User ID</span>
                    <span style="font-size: 16px; font-weight: 800; color: #1e3a8a; font-family: monospace;">${userCode}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; display: block; margin-bottom: 4px;">Registered Officer Email</span>
                    <span style="font-size: 15px; font-weight: 600; color: #0f172a;">${toEmail}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; background: #fffbeb;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #b45309; display: block; margin-bottom: 4px;">Temporary Initial Password</span>
                    <span style="font-size: 16px; font-weight: 800; color: #92400e; font-family: monospace;">${temporaryPassword}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; display: block; margin-bottom: 4px;">Assigned Municipal Department</span>
                    <span style="font-size: 15px; font-weight: 600; color: #0f172a;">${departmentName} (${departmentCode})</span>
                  </td>
                </tr>
              </table>

              <!-- Login CTA Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                      Access Department Officer Desk &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #1e293b;">
                  <strong>Self-Service Password Security:</strong> You can sign in using either your <strong>User ID (${userCode})</strong> or your <strong>Email</strong>. If you wish to change your password, you can use the <strong>Forgot Password</strong> option on the sign-in page to receive a 6-digit OTP to this email at any time.
                </p>
              </div>

              <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0;">
                For municipal governance questions or jurisdictional adjustments, contact the Central Municipal Administration Office.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #64748b; text-align: center;">
              <div>NagrikSeva Digital Municipal Administration System</div>
              <div style="margin-top: 4px; font-size: 11px; color: #94a3b8;">
                This is an automated administrative credential transmission.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const activeTransporter = getTransporter();
    const info = await activeTransporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html
    });

    console.log(`[MailService] ✉️ Department officer welcome email successfully sent to ${toEmail} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[MailService] ❌ Failed to send department credentials email to ${toEmail}:`, error.message);
    console.log(`[MailService] [FALLBACK CONSOLE] Credentials for ${toEmail}: ID: [ ${userCode} ] Password: [ ${temporaryPassword} ]`);
    return false;
  }
}

export default {
  sendPasswordResetOtpEmail,
  sendDepartmentOfficerWelcomeEmail
};

