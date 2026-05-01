import nodemailer from 'nodemailer';

/**
 * PRODUCTION CONFIGURATION
 * Using explicit host/port settings is more reliable on Railway than 'service: gmail'
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, 
  secure: true, // Use true for 465, false for 587
  auth: {
    user: process.env.APP_USERNAME,
    pass: process.env.APP_PASSWORD, // Must be a 16-digit App Password
  },
  pool: true, // Keeps the connection open for multiple emails
  maxConnections: 5,
  connectionTimeout: 10000, // 10 seconds
});

// 1. Welcome Email for New Clients
export const EmailClient = async (email, name) => {
  try {
    const info = await transporter.sendMail({
      from: `"ProConnect Team" <${process.env.APP_USERNAME}>`,
      to: email,
      subject: "🎉 Welcome to ProConnect",
      html: `
        <div style="font-family: Arial, sans-serif; background:#f3f4f6; padding:40px;">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.1);">
            <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:white;">
              <h1 style="margin:0;font-size:24px;">Welcome to ProConnect 🎉</h1>
            </div>
            <div style="padding:30px;color:#111827;">
              <h2 style="margin-top:0;">Hello ${name}, 👋</h2>
              <p>We're excited to have you on board! ProConnect connects you with trusted professionals effortlessly.</p>
              <div style="text-align:center;margin-top:25px;">
                <a href="https://your-app-url.com/dashboard" style="background:#4f46e5;color:white;padding:12px 22px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Go to Dashboard</a>
              </div>
            </div>
            <div style="background:#f3f4f6;text-align:center;padding:14px;font-size:12px;color:#6b7280;">
              © ${new Date().getFullYear()} ProConnect • All rights reserved
            </div>
          </div>
        </div>
      `,
    });
    console.log("Welcome email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Welcome Email Error:", error.message);
    return null; // Prevents app crash
  }
};

// 2. Security Alert for Logins
export const LoginEmail = async (email) => {
  try {
    const info = await transporter.sendMail({
      from: `"ProConnect Security" <${process.env.APP_USERNAME}>`,
      to: email,
      subject: "🔐 Security Alert: New Login Detected",
      html: `
        <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px;">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,0.1);">
            <div style="background:#4f46e5;padding:20px;text-align:center;color:white;">
              <h2 style="margin:0;">Security Alert</h2>
            </div>
            <div style="padding:30px;color:#333;">
              <h3>New Login Detected 🔐</h3>
              <p>We noticed a new login to your ProConnect account at ${new Date().toLocaleString()}.</p>
              <p>If this was not you, please secure your account immediately.</p>
            </div>
            <div style="background:#f3f4f6;text-align:center;padding:15px;font-size:12px;color:#777;">
              © ${new Date().getFullYear()} ProConnect
            </div>
          </div>
        </div>
      `,
    });
    console.log("Security alert sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Security Email Error:", error.message);
    return null;
  }
};