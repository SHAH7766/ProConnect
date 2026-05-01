import nodemailer from 'nodemailer';

/**
 * SHARED TRANSPORTER
 * Configured specifically for Railway's network to avoid connection timeouts.
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, 
  secure: true, // true for port 465
  auth: {
    user: process.env.APP_USERNAME,
    pass: process.env.APP_PASSWORD, // Must be your 16-digit Google App Password
  },
  pool: true,
  maxConnections: 5,
  connectionTimeout: 10000, 
});

export const sendOtpEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"ProConnect Team" <${process.env.APP_USERNAME}>`,
      to: email,
      subject: "Your Verification Code: " + otp,
      html: `
        <div style="margin:0; padding:0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            
            <!-- Gradient Header -->
            <tr>
              <td align="center" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">ProConnect</h1>
                <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 14px; opacity: 0.9;">Secure Professional Marketplace</p>
              </td>
            </tr>

            <!-- Main Body -->
            <tr>
              <td style="padding: 40px 30px; text-align: center;">
                <div style="margin-bottom: 24px;">
                  <span style="background-color: #f3f4f6; color: #4f46e5; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Security Verification</span>
                </div>
                
                <h2 style="margin: 0 0 16px; color: #111827; font-size: 22px; font-weight: 700;">Verify your account</h2>
                <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Hello! Use the verification code below to securely sign in or reset your account. This code will expire in <span style="color: #ef4444; font-weight: 600;">5 minutes</span>.
                </p>

                <!-- High-Impact OTP Display -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                  <div style="font-size: 42px; font-weight: 800; color: #4f46e5; letter-spacing: 10px; margin-bottom: 8px;">${otp}</div>
                  <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Verification Code</div>
                </div>

                <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                  Didn't request this? You can safely ignore this message.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #f3f4f6;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                  &copy; ${new Date().getFullYear()} ProConnect Marketplace. All rights reserved.<br>
                  Lahore, Pakistan
                </p>
              </td>
            </tr>
          </table>
        </div>
      `,
    });

    console.log("OTP email sent: %s", info.messageId);
    return info;

  } catch (error) {
    // Prevents unhandledRejection which crashes the Railway process
    console.error("OTP Email Error:", error.message);
    return null; 
  }
};