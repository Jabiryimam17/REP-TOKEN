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
const code_templates = {
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
    }),
    password_reset: (code) => ({
        subject: "Reset Your Password - REP TOKEN",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4F46E5; text-align: center;">Password Reset Request</h2>
                <p>We received a request to reset your password. Please use the verification code below to proceed:</p>
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
const status_templates = {
    jobNotification: (status) => ({
        subject: `Job Update - REP TOKEN`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4F46E5; text-align: center;">Job Status Update</h2>
                <p>Dear participant,</p>
                <p>Your job has a new status:</p>
                <div style="background: #F3F4F6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; border-radius: 5px; margin: 20px 0;">
                    ${status}
                </div>
                <p>Please check your account for details and any required actions.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2024 REP TOKEN. All rights reserved.</p>
            </div>
        `
    })
}

/**
 * Sends a verification email.
 * @param {string} to - Recipient email address
 * @param template
 */
const send_email = async (to, template) => {
    try {
        const mail_options = {
            from:`"REP TOKEN" <${process.env.EMAIL_SENDER}>`,
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
}
export const send_verification_email = async (to, code) => {
        const template = code_templates.verification(code);
        return await send_email(to, template);

};
export const send_password_reset_email = async (to, code) => {
    const template = code_templates.password_reset(code);
    return await send_email(to, template);
};
const selection_template = {
    verifierSelected: (job_id) => ({
        subject: "You’ve Been Selected as a Verifier - REP TOKEN",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                
                <h2 style="color: #4F46E5; text-align: center;">Verifier Assignment</h2>
                
                <p>Hello,</p>
                
                <p>You have been selected as a <strong>verifier</strong> for a new job/dispute.</p>
                
                <div style="background: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Job ID:</strong> ${job_id}</p>
                </div>
                
                <p>Please review the job details and submit your evaluation before the deadline.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/jobs/${job_id}" 
                       style="background: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        View Job
                    </a>
                </div>
                
                <p>If you believe this assignment was made in error, you can safely ignore this email.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p style="font-size: 12px; color: #888; text-align: center;">
                    &copy; 2024 REP TOKEN. All rights reserved.
                </p>
            </div>
        `
    })
};
export const send_selection_email = async (to, job_id) => {
    const template = selection_template.verifierSelected(job_id);
    return await send_email(to, template);
}
export const send_job_notifications = async (
    to, status) => {
    const template = status_templates.jobNotification(status);
    return await send_email(to, template);
}
export default send_verification_email;