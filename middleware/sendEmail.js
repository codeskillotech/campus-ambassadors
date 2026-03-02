import nodemailer from "nodemailer";

async function createGmailTransporter() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.verify();
  console.log("✅ Gmail SMTP connected successfully!");
  return transporter;
}

/**
 * sendEmail({ to, subject, text, html })
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!to) {
      return { success: false, error: "No recipients defined (to is missing)" };
    }

    const transporter = await createGmailTransporter();

    const mailOptions = {
      from: `"SkillOTech" <${process.env.SMTP_USER}>`,
      to, // ✅ must be string or array of strings
      subject: subject || "SkillOTech Notification",
      text: text || "",
      html: html || "",
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${to}`);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return { success: false, error: error.message };
  }
};