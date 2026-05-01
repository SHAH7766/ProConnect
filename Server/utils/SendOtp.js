import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (email, otp) => {
  try {
    const response = await resend.emails.send({
      from: "ProConnect Team <onboarding@resend.dev>", // replace later with verified domain
      to: email,
      subject: `Your Verification Code: ${otp}`,
      html: `
        <div style="margin:0; padding:0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            
            <tr>
              <td align="center" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">ProConnect</h1>
                <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 14px;">Secure Professional Marketplace</p>
              </td>
            </tr>

            <tr>
              <td style="padding: 40px 30px; text-align: center;">
                <span style="background-color: #f3f4f6; color: #4f46e5; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 700;">Security Verification</span>

                <h2 style="margin: 20px 0 16px; color: #111827;">Verify your account</h2>

                <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Use the code below to verify your account. It expires in <b style="color:#ef4444;">5 minutes</b>.
                </p>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                  <div style="font-size: 42px; font-weight: 800; color: #4f46e5; letter-spacing: 10px;">
                    ${otp}
                  </div>
                  <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">
                    Verification Code
                  </div>
                </div>

                <p style="margin-top: 30px; color: #9ca3af; font-size: 14px;">
                  Didn't request this? You can ignore this email.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  © ${new Date().getFullYear()} ProConnect Marketplace
                </p>
              </td>
            </tr>

          </table>
        </div>
      `,
    });

    console.log("OTP email sent:", response);
    return response;

  } catch (error) {
    console.error("OTP Email Error:", error.message);
    return null;
  }
};