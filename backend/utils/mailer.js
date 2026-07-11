const nodemailer = require('nodemailer');

/**
 * Sends an email alert to the caregiver when high-priority emergencies are triggered.
 * If SMTP credentials are not configured in .env, it falls back to console output.
 */
const sendEmailAlert = async (subject, text, html) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.ALERT_EMAIL_TO;

  if (!host || !user || !pass || !to) {
    console.warn('--------------------------------------------------');
    console.warn('⚠️  EMAIL ALERT SIMULATION (SMTP NOT FULLY CONFIGURED):');
    console.warn(`To: ${to || '[ALERT_EMAIL_TO not set]'}`);
    console.warn(`Subject: ${subject}`);
    console.warn(`Body:\n${text}`);
    console.warn('--------------------------------------------------');
    return { success: true, loggedToConsole: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: {
        user,
        pass
      }
    });

    const info = await transporter.sendMail({
      from: `"AI ElderCare Guardian Alert" <${user}>`,
      to,
      subject,
      text,
      html: html || `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #f0a0a0; border-radius: 8px;">
        <h2 style="color: #d9534f;">⚠️ AI ElderCare Guardian Emergency Alert</h2>
        <p style="font-size: 16px; white-space: pre-wrap;">${text}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <small style="color: #777;">This is an automated security alert from your local AI ElderCare Guardian system.</small>
      </div>`
    });

    console.log(`Email alert successfully sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email alert:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmailAlert };
