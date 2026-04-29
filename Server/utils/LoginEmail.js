import nodemailer from 'nodemailer';

export const LoginEmail = async (email) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.APP_USERNAME,
        pass: process.env.APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"ProConnect Security" <${process.env.APP_USERNAME}>`,
      to: email,
      subject: "🔐 Security Alert: New Login Detected",
      html: `
        <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px;">
          
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background:#4f46e5;padding:20px;text-align:center;color:white;">
              <h2 style="margin:0;">ProConnect Security Alert</h2>
            </div>

            <!-- Body -->
            <div style="padding:30px;color:#333;">
              <h3 style="margin-top:0;">New Login Detected 🔐</h3>

              <p style="font-size:15px;line-height:1.6;">
                We noticed a new login to your ProConnect account. If this was you, you can safely ignore this email.
              </p>

              <div style="background:#f9fafb;border-left:4px solid #4f46e5;padding:15px;margin:20px 0;border-radius:6px;">
                <p style="margin:0;"><strong>Email:</strong> ${email}</p>
                <p style="margin:5px 0 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>

              <p style="font-size:14px;color:#555;">
                If you did NOT perform this login, we strongly recommend changing your password immediately to secure your account.
              </p>

              <div style="text-align:center;margin-top:30px;">
                <a href="#" style="background:#4f46e5;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
                  Secure My Account
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background:#f3f4f6;text-align:center;padding:15px;font-size:12px;color:#777;">
              © ${new Date().getFullYear()} ProConnect. All rights reserved.
            </div>

          </div>
        </div>
      `,
    });

    console.log("Alert sent: %s", info.messageId);
    return info;

  } catch (error) {
    console.error("Email Error:", error);
  }
};