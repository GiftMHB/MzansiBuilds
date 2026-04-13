const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configuring email transporter (using MailHog for development)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: process.env.SMTP_PORT || 1025,
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});

const verifyTransporter = async () => {
    try {
        await transporter.verify();
        console.log('Email service ready (MailHog)');
        return true;
    } catch (error) {
        console.error('Email service error:', error.message);
        return false;
    }
};

const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const sendPasswordResetEmail = async (email, resetToken, userName) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
        from: '"MzansiBuilds" <noreply@mzanisbuilds.com>',
        to: email,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2e7d32;">MzansiBuilds Password Reset</h2>
                <p>Hello ${userName},</p>
                <p>You requested to reset your password. Click the link below to proceed:</p>
                <a href="${resetUrl}" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>This link expires in 1 hour.</p>
                <p>If you didn't request this, ignore this email.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">MzansiBuilds - Build in Public</p>
            </div>
        `
    };
    
    await transporter.sendMail(mailOptions);
    return resetToken;
};

module.exports = {
    generateResetToken,
    sendPasswordResetEmail,
    verifyTransporter
};