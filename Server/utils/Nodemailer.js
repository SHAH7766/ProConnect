import nodemailer from 'nodemailer'
export const EmailClient = async (email,name) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", 
            auth: {
                user: process.env.APP_USERNAME,
                pass: process.env.APP_PASSWORD,
            },
        });
        const info = await transporter.sendMail({
            from: process.env.ADMIN_USER,
            to: email, 
            subject: "Welcome to ProConnect",
            text: `Hello ${name}, welcome to our platform!`, 
            html: `<b>Hello ${name},</b><p>Welcome to our platform!</p>`,
        });

        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Email Error:", error);
    }
}