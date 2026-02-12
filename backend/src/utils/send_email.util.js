import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env'});

/**
 * Transporter configuration.
 * Ensure you have EMAIL_USER and EMAIL_PASS in your .env file.
 * For Gmail, use an App Password.
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD
    }
});



/**
 * Email Templates
 */
const templates = {
    verification: (code) => ({
        subject: "Verify Your Email - REP TOKEN",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4F46E5; text-align: center;">Welcome to REP TOKEN!</h2>
                <p>Thank you for signing up. Please use the verification code below to complete your registration:</p>
                <div style="background: #F3F4F6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
                    ${code}
                </div>
                <p>This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2024 REP TOKEN. All rights reserved.</p>
            </div>
        `
    })
};

/**
 * Sends a verification email.
 * @param {string} to - Recipient email address
 * @param {string} code - The verification code to send
 */
export const send_verification_email = async (to, code) => {
    try {
        const template = templates.verification(code);

        const mail_options = {
            from: `"REP TOKEN" <${process.env.EMAIL_SENDER}>`,
            to,
            subject: template.subject,
            html: template.html
        };

        const info = await transporter.sendMail(mail_options);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message };
    }
};
export default send_verification_email;