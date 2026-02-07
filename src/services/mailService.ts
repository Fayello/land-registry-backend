import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER || "fayellnouh@gmail.com",
        pass: process.env.MAIL_PASS, // User must provide an App Password
    },
});

export const MailService = {
    sendOTP: async (to: string, otp: string) => {
        const mailOptions = {
            from: `"MINDCAF Land Registry" <${process.env.MAIL_USER || "fayellnouh@gmail.com"}>`,
            to,
            subject: "MINDCAF Security Code",
            text: `Your one-time password (OTP) is: ${otp}. This code expires in 10 minutes.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
                    <h2 style="color: #1e3a8a; text-transform: uppercase;">Security Verification</h2>
                    <p style="color: #64748b;">You requested a password reset for your Land Registry account.</p>
                    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
                        <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #1e293b;">${otp}</span>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
                    <p style="font-size: 10px; color: #cbd5e1; text-align: center;">MINDCAF • Digital Property Registry Systems</p>
                </div>
            `,
        };

        return transporter.sendMail(mailOptions);
    },
};
