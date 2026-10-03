import nodemailer from "nodemailer";

const escapeHtml = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const getTransporter = () => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        throw new Error("SMTP_USER and SMTP_PASS are not configured");
    }

    return nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || "gmail",
        auth: {
            user,
            pass,
        },
    });
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const safeName = escapeHtml(name || "there");
    const safeUrl = escapeHtml(resetUrl);

    await transporter.sendMail({
        from: `NexTalk <${from}>`,
        to,
        subject: "Reset your NexTalk password",
        text: `Hi ${name || "there"},\n\nWe received a request to reset your NexTalk password. Use the link below to create a new password:\n\n${resetUrl}\n\nThis link expires in 15 minutes. If you did not request a password reset, you can safely ignore this email.\n\nNexTalk`,
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b;max-width:560px;margin:0 auto;padding:24px">
                <h2 style="margin:0 0 12px">Reset your NexTalk password</h2>
                <p>Hi ${name || "there"},</p>
                <p>We received a request to reset your NexTalk password.</p>
                <p style="margin:24px 0">
                    <a href="${safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600">Reset Password</a>
                </p>
                <p>This link expires in <strong>15 minutes</strong>.</p>
                <p>If you did not request a password reset, you can safely ignore this email.</p>
                <p style="margin-top:28px;color:#71717a">NexTalk</p>
            </div>
        `,
    });
};
