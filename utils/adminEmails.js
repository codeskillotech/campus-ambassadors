// // utils/adminEmails.js
// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   service: "gmail", // or "Zoho" depending on your SMTP provider
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// // ✅ Ambassador Approval Email
// export const sendApprovalEmail = async (ambassador) => {
//   await transporter.sendMail({
//     from: `"SkillOTech" <${process.env.SMTP_USER}>`,
//     to: ambassador.email,
//     subject: "Ambassador Application Approved",
//     html: `<p>Hi ${ambassador.fullName},</p>
//            <p>Congratulations! Your ambassador application has been approved.</p>`,
//   });
// };

// // ❌ Ambassador Rejection Email
// export const sendRejectionEmail = async (ambassador, reason) => {
//   await transporter.sendMail({
//     from: `"SkillOTech" <${process.env.SMTP_USER}>`,
//     to: ambassador.email,
//     subject: "Ambassador Application Rejected",
//     html: `<p>Hi ${ambassador.fullName},</p>
//            <p>We regret to inform you that your application was rejected.</p>
//            <p><b>Reason:</b> ${reason || "Not specified"}.</p>`,
//   });
// };

// // 🔑 Password Reset OTP Email
// export const sendPasswordResetOtpEmail = async (to, otp) => {
//   await transporter.sendMail({
//     from: `"SkillOTech" <${process.env.SMTP_USER}>`,
//     to,
//     subject: "Password Reset OTP",
//     html: `<p>You requested to reset your password.</p>
//            <p>Your OTP is: <b>${otp}</b></p>
//            <p>This OTP will expire in 10 minutes.</p>`,
//   });
// };



// utils/adminEmails.js
import sgMail from "@sendgrid/mail";

// ✅ Initialize SendGrid client
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.SENDGRID_FROM; // must be a verified sender in SendGrid
const FROM_NAME = process.env.SENDGRID_NAME || "SkillOTech";

// Helper to send email
async function sendEmail({ to, subject, html }) {
  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject,
      html,
    };

    await sgMail.send(msg);
    console.log(`📧 Email sent successfully to ${to}`);
    return { success: true };
  } catch (err) {
    console.error("❌ Email send failed:", err.response?.body || err.message);
    return { success: false, error: err.message };
  }
}

// ✅ Ambassador Approval Email
export const sendApprovalEmail = async (ambassador) => {
  return await sendEmail({
    to: ambassador.email,
    subject: "Ambassador Application Approved",
    html: `<p>Hi ${ambassador.fullName},</p>
           <p>Congratulations! Your ambassador application has been approved.</p>`,
  });
};

// ❌ Ambassador Rejection Email
export const sendRejectionEmail = async (ambassador, reason) => {
  return await sendEmail({
    to: ambassador.email,
    subject: "Ambassador Application Rejected",
    html: `<p>Hi ${ambassador.fullName},</p>
           <p>We regret to inform you that your application was rejected.</p>
           <p><b>Reason:</b> ${reason || "Not specified"}.</p>`,
  });
};

// 🔑 Password Reset OTP Email
export const sendPasswordResetOtpEmail = async (to, otp) => {
  return await sendEmail({
    to,
    subject: "Password Reset OTP",
    html: `<p>You requested to reset your password.</p>
           <p>Your OTP is: <b>${otp}</b></p>
           <p>This OTP will expire in 10 minutes.</p>`,
  });
};
