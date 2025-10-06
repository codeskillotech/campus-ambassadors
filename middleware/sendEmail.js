// import nodemailer from "nodemailer";

// async function createGmailTransporter() {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail", // use Gmail service
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//     });

//     await transporter.verify();
//     console.log("✅ Gmail SMTP connected successfully!");
//     return transporter;
//   } catch (err) {
//     console.error("❌ Gmail SMTP verify failed:", err.message);
//     throw err;
//   }
// }

// export const sendEmail = async (to, subject, otp) => {
//   try {
//     const transporter = await createGmailTransporter();

//     const mailOptions = {
//       from: `"SkillOTech" <${process.env.SMTP_USER}>`,
//       to,
//       subject,
//       text: `Hi,\n\nYour OTP is: ${otp}\nThis code will expire in 5 minutes.\n\n- SkillOTech Team`,
//       html: `<p>Hi,</p>
//              <p>Your OTP is: <b>${otp}</b></p>
//              <p>This code will expire in 5 minutes.</p>
//              <p>- SkillOTech Team</p>`,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`📧 Gmail OTP email sent successfully to ${to}`);
//     return { success: true, message: "Email sent successfully" };
//   } catch (error) {
//     console.error("❌ Gmail email send failed:", error.message);
//     return { success: false, error: error.message };
//   }
// };


import sgMail from "@sendgrid/mail";

/**
 * Create reusable SendGrid client
 */
async function createSendGridClient() {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log("✅ SendGrid client initialized successfully!");
    return sgMail;
  } catch (err) {
    console.error("❌ SendGrid initialization failed:", err.message);
    throw err;
  }
}

/**
 * Send email via SendGrid
 */
export const sendEmail = async (to, subject, text, html = null) => {
  try {
    const sgClient = await createSendGridClient();

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM, // must match verified sender in SendGrid
        name: process.env.SENDGRID_NAME || "SkillOTech",
      },
      subject,
      text,
      ...(html && { html }),
    };

    await sgClient.send(msg);
    console.log(`📧 Email sent successfully to ${to}`);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Email send failed:", error.response?.body || error.message);
    return { success: false, error: error.message };
  }
};
