import nodemailer from "nodemailer";

async function createGmailTransporter() {
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();

  if (!user) throw new Error("SMTP_USER is missing in server environment");
  if (!pass) throw new Error("SMTP_PASS is missing in server environment");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.verify();
  return transporter;
}

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const smtpUser = (process.env.SMTP_USER || "").trim();
    const fromEmail = (process.env.SMTP_FROM || smtpUser).trim();

    if (!fromEmail) {
      return { success: false, error: "SMTP_FROM/SMTP_USER missing (from email not set)" };
    }

    const transporter = await createGmailTransporter();

    const mailOptions = {
      // ✅ make from ALWAYS a proper string
      from: fromEmail,
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};