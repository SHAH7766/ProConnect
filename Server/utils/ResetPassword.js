import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const resetpassword = async (email, resetLink) => {
  try {
    const response = await resend.emails.send({
      from: "ProConnect Support <onboarding@resend.dev>", // replace later with your domain
      to: email,
      subject: "🔑 Reset Your ProConnect Password",
      html: `
        <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px;">
          
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,0.1);">
            
            <div style="background:#4f46e5;padding:20px;text-align:center;color:white;">
              <h2 style="margin:0;">ProConnect Password Reset</h2>
            </div>

            <div style="padding:30px;color:#333;">
              <h3 style="margin-top:0;">Forgot your password? 🔑</h3>

              <p style="font-size:15px;line-height:1.6;">
                We received a request to reset your ProConnect account password. Click the button below to set a new one. This link will expire in 15 minutes.
              </p>

              <div style="text-align:center;margin:30px 0;">
                <a href="${resetLink}" style="background:#4f46e5;color:#fff;padding:14px 25px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
                  Reset My Password
                </a>
              </div>

              <p style="font-size:14px;color:#555;">
                If you did not request this, you can safely ignore this email.
              </p>

              <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />

              <p style="font-size:12px;color:#999;word-break:break-all;">
                If the button doesn't work, copy this link:<br/>
                <a href="${resetLink}" style="color:#4f46e5;">${resetLink}</a>
              </p>
            </div>

            <div style="background:#f3f4f6;text-align:center;padding:15px;font-size:12px;color:#777;">
              © ${new Date().getFullYear()} ProConnect. All rights reserved.
            </div>

          </div>
        </div>
      `,
    });

    console.log("Reset email sent:", response);
    return response;

  } catch (error) {
    console.error("Password Reset Email Error:", error.message);
    return null;
  }
};