import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const LoginEmail = async (email) => {
  try {
    const response = await resend.emails.send({
      from: "ProConnect Security <onboarding@resend.dev>", // change after domain verify
      to: email,
      subject: "🔐 Security Alert: New Login Detected",
      html: `
        <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px;">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,0.1);">
            
            <div style="background:#4f46e5;padding:20px;text-align:center;color:white;">
              <h2 style="margin:0;">ProConnect Security Alert</h2>
            </div>

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
                If you did NOT perform this login, we recommend changing your password immediately.
              </p>

              <div style="text-align:center;margin-top:30px;">
                <a href="https://proconnect.com/secure" style="background:#4f46e5;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
                  Secure My Account
                </a>
              </div>
            </div>

            <div style="background:#f3f4f6;text-align:center;padding:15px;font-size:12px;color:#777;">
              © ${new Date().getFullYear()} ProConnect. All rights reserved.
            </div>

          </div>
        </div>
      `,
    });

    console.log("Security Alert sent:", response);
    return response;

  } catch (error) {
    console.error("Login Notification Error:", error.message);
    return null;
  }
};