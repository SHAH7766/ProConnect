import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const EmailClient = async (email, name) => {
  try {
    const response = await resend.emails.send({
      from: "ProConnect Team <onboarding@resend.dev>", // replace later with verified domain
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

              <p>
                We're excited to have you on board! ProConnect connects you with trusted professionals effortlessly.
              </p>

              
            </div>

            <div style="background:#f3f4f6;text-align:center;padding:14px;font-size:12px;color:#6b7280;">
              © ${new Date().getFullYear()} ProConnect • All rights reserved
            </div>

          </div>
        </div>
      `,
    });

    console.log("Welcome email sent:", response);
    return response;

  } catch (error) {
    console.error("Welcome Email Error:", error.message);
    return null;
  }
};