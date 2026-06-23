const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if SMTP is configured
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.log('\n=========================================');
    console.log('📬  MOCKED EMAIL DISPATCH (DEV MODE)');
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('-----------------------------------------');
    console.log(options.text);
    console.log('=========================================\n');
    return { mocked: true, message: 'Email output logged to console' };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Define message options
  const message = {
    from: `${process.env.SMTP_FROM_NAME || 'SQLGenie AI'} <${process.env.SMTP_FROM || 'noreply@sqlgenie.ai'}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  const info = await transporter.sendMail(message);
  console.log(`Message sent: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;
