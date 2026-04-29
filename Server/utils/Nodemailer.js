import nodemailer from 'nodemailer';

export const EmailClient = async (email, name) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.APP_USERNAME,
        pass: process.env.APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"ProConnect Team" <${process.env.APP_USERNAME}>`,
      to: email,
      subject: "🎉 Welcome to ProConnect",
      html: `
      <div style="font-family: Arial, sans-serif; background:#f3f4f6; padding:40px;">

        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.1);">

          <!-- HEADER -->
          <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:white;">
            <h1 style="margin:0;font-size:24px;">Welcome to ProConnect 🎉</h1>
            <p style="margin-top:8px;font-size:13px;opacity:0.9;">
              Your journey starts here
            </p>
          </div>

          <!-- BODY -->
          <div style="padding:30px;color:#111827;">

            <h2 style="margin-top:0;">Hello ${name}, 👋</h2>

            <p style="font-size:14px;line-height:1.6;color:#374151;">
              We're excited to have you on board! ProConnect is designed to connect you with trusted professionals and services effortlessly.
            </p>

            <!-- FEATURES BOX -->
            <div style="background:#f9fafb;border-left:4px solid #4f46e5;padding:15px;margin:20px 0;border-radius:8px;">
              <p style="margin:0;"><strong>✔ Find trusted providers</strong></p>
              <p style="margin:6px 0;"><strong>✔ Submit & track complaints easily</strong></p>
              <p style="margin:6px 0;"><strong>✔ Secure and fast communication</strong></p>
            </div>

            <p style="font-size:14px;color:#4b5563;">
              You can now log in and start exploring all features of your dashboard.
            </p>

            <!-- CTA BUTTON -->
            <div style="text-align:center;margin-top:25px;">
              <a href="#"
                style="background:#4f46e5;color:white;padding:12px 22px;
                text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
                Go to Dashboard
              </a>
            </div>

          </div>

          <!-- FOOTER -->
          <div style="background:#f3f4f6;text-align:center;padding:14px;font-size:12px;color:#6b7280;">
            © ${new Date().getFullYear()} ProConnect • All rights reserved
          </div>

        </div>
      </div>
      `,
    });

    console.log("Message sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("Email Error:", error);
  }
};