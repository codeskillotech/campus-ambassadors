// controller/admin.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../model/admin.model.js";
import Ambassador from "../model/user.model.js";
import { sendApprovalEmail, sendRejectionEmail,sendPasswordResetOtpEmail } from "../utils/adminEmails.js";

/* ----------------- Register Admin ----------------- */
export const registerAdmin = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // check duplicate
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      fullName,
      email,
      password: hashedPassword,
      role: role || "ADMIN"
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ----------------- Login Admin ----------------- */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};




/* ----------------- Get Pending Ambassadors ----------------- */
export const getPendingAmbassadors = async (req, res) => {
  try {
    const ambassadors = await Ambassador.find({ status: "PENDING" })
      .select("fullName email whatsapp status createdAt")
      .sort({ createdAt: -1 });

    res.json({ success: true, ambassadors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export const getAmbassadorById = async (req, res) => {
  try {
    const { id } = req.params;

    const ambassador = await Ambassador.findById(id);

    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    res.json({ success: true, ambassador });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export const approveAmbassador = async (req, res) => {
  try {
    const { id } = req.params;

    const ambassador = await Ambassador.findByIdAndUpdate(
      id,
      { status: "APPROVED" },
      { new: true }
    );

    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    // ✅ Send approval email
    await sendApprovalEmail(ambassador);

    res.json({ success: true, message: "Ambassador approved", ambassador });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ----------------- Reject Ambassador ----------------- */
export const rejectAmbassador = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const ambassador = await Ambassador.findByIdAndUpdate(
      id,
      { status: "REJECTED" },
      { new: true }
    );

    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    // ❌ Send rejection email
    await sendRejectionEmail(ambassador, reason);

    res.json({ success: true, message: "Ambassador rejected", ambassador });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export const forgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    admin.resetOtp = otp;
    admin.resetOtpExpire = Date.now() + 10 * 60 * 1000; // 10 min expiry
    await admin.save();

    await sendPasswordResetOtpEmail(admin.email, otp);

    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ----------------- Reset Password with OTP ----------------- */
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // check password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const admin = await Admin.findOne({
      email,
      resetOtp: otp,
      resetOtpExpire: { $gt: Date.now() }, // not expired
    });

    if (!admin) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;

    // clear OTP
    admin.resetOtp = undefined;
    admin.resetOtpExpire = undefined;

    await admin.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


/* ----------------- Change Password ----------------- */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // check new password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // find admin using JWT payload (req.admin is set in isAdmin middleware)
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // check old password
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Old password is incorrect" });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;

    await admin.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// LOGOUT Admin
export const logoutAdmin = async (req, res) => {
  try {
    // Nothing to clear on backend for JWT
    res.json({
      success: true,
      message: "Admin logged out successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


/* ----------------- Get Approved Ambassadors ----------------- */
export const getApprovedAmbassadors = async (req, res) => {
  try {
    const ambassadors = await Ambassador.find({ status: "APPROVED" })
      .select("fullName email whatsapp status createdAt")
      .sort({ createdAt: -1 });

    res.json({ success: true, ambassadors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// controller/admin.controller.js
export const assignFormLink = async (req, res) => {
  try {
    const { id } = req.params;       // ambassador ID
    const { formLink } = req.body;   // link from admin

    const ambassador = await Ambassador.findByIdAndUpdate(
      id,
      { formLink },
      { new: true }
    );

    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    res.json({
      success: true,
      message: "Form link assigned successfully",
      ambassador,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// controller/admin.controller.js

/* ----------------- Get Ambassadors Who Submitted Links ----------------- */
export const getAmbassadorsWithLinks = async (req, res) => {
  try {
    const ambassadors = await Ambassador.find({
      $or: [
        { referralLink: { $ne: null } },
        { customFormLink: { $ne: null } }
      ]
    })
      .select("fullName email whatsapp status referralLink customFormLink createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      ambassadors
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// controller/admin.controller.js

/* ----------------- Get Ambassadors Who Submitted Activities Form ----------------- */
export const getAmbassadorsWithActivitiesForm = async (req, res) => {
  try {
    const ambassadors = await Ambassador.find({
      activitiesFormLink: { $ne: null }
    })
      .select("fullName email whatsapp status activitiesFormLink createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      ambassadors
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


