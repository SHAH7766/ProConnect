import nodemailer from 'nodemailer'
export const LoginEmail = async (email) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", // Use 'service' for easier Gmail setup
            auth: {
                user: process.env.APP_USERNAME,
                pass: process.env.APP_PASSWORD, // This must be an "App Password"
            },
        });

        const info = await transporter.sendMail({
            from: process.env.ADMIN_USER,
            to: email, // Use the actual email string here
            subject: "Security alert:New login detected",
            text: `You have successfully logged on to ProConnect`, 
            html: ``,
        });

        console.log("Alert sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Email Error:", error);
    }
}