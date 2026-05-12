import { Resend } from "resend";

let resend;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing. Booking email notification is disabled.");
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
};

export const sendBookingNotification = async (providerEmail, bookingDetails) => {
  try {
    const resendClient = getResendClient();
    const response = await resendClient.emails.send({
      from: "ProConnect Requests <onboarding@resend.dev>",
      to: providerEmail,
      subject: `New ${bookingDetails.serviceCategory} request on ProConnect`,
      html: `
        <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:32px;">
          <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,0.08);">
            <div style="background:#4f46e5;padding:22px;color:#ffffff;">
              <h2 style="margin:0;">New Service Request</h2>
            </div>
            <div style="padding:28px;color:#111827;">
              <p style="font-size:15px;line-height:1.6;">A customer has sent you a new request on ProConnect.</p>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:18px 0;">
                <p><strong>Customer:</strong> ${bookingDetails.customerName}</p>
                <p><strong>Service:</strong> ${bookingDetails.serviceCategory}</p>
                <p><strong>Scheduled date:</strong> ${bookingDetails.scheduledDate}</p>
                <p><strong>Charges:</strong> Rs. ${bookingDetails.charges || 0}</p>
                <p><strong>Description:</strong> ${bookingDetails.description || "No description provided"}</p>
              </div>
              <p style="font-size:14px;color:#4b5563;">Log in to ProConnect and open your profile dashboard to accept the request.</p>
            </div>
            <div style="background:#f3f4f6;text-align:center;padding:14px;font-size:12px;color:#6b7280;">
              © ${new Date().getFullYear()} ProConnect
            </div>
          </div>
        </div>
      `,
    });

    console.log("Booking notification sent:", response);
    return response;
  } catch (error) {
    console.error("Booking Notification Error:", error.message);
    return null;
  }
};
