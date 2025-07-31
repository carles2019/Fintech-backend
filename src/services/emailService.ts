import nodemailer from 'nodemailer';

/**
 * Sends an OTP code to the user's email address.
 */
export const sendOtpEmail = async (
  recipientEmail: string,
  otpCode: string
): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Vault Transfers" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: 'Your One-Time Transfer Code',
      text: `Your OTP code is: ${otpCode}`,
      html: `
        <div style="font-family: sans-serif; font-size: 16px;">
          <p>Hello,</p>
          <p>Your OTP code to complete your transfer is:</p>
          <h2 style="color: #007bff;">${otpCode}</h2>
          <p>This code will expire shortly. Please do not share it.</p>
          <p>— Vault Security</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    throw new Error('OTP email delivery failed');
  }
};