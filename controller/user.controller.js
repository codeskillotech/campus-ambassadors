import Ambassador from "../model/user.model.js";
import Otp from "../model/otp.model.js";
import { sendEmail } from "../middleware/sendEmail.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
/* --------------------- Send OTP --------------------- */
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove old OTP for this email (avoid duplicates)
    await Otp.deleteMany({ email });

    // Save new OTP
    await new Otp({ email, otp }).save();

    // Send email
    await sendEmail(email, "Your SkillOTech Ambassador OTP", `Your OTP is ${otp}.`);

    res.json({ success: true, message: "OTP sent to email." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* --------------------- Verify OTP --------------------- */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP required" });
    }

    const record = await Otp.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // OTP is valid → delete it
    await Otp.deleteMany({ email });

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* --------------------- Register Ambassador --------------------- */
export const registerAmbassador = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Check OTP verified
    const otpExists = await Otp.findOne({ email });
    if (otpExists) {
      return res.status(400).json({ success: false, message: "Please verify OTP first." });
    }

    // ✅ Prevent duplicate
    const existing = await Ambassador.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create Ambassador with all fields in one request
    const ambassador = new Ambassador({
      ...req.body,
      password: hashedPassword
    });

    await ambassador.save();

    res.status(201).json({
      success: true,
      message: "Ambassador registered successfully",
      ambassador
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export const loginAmbassador = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find ambassador
    const ambassador = await Ambassador.findOne({ email });
    if (!ambassador) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // check status
    if (ambassador.status !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Your account is not approved yet. Please wait for admin approval."
      });
    }

    // verify password
    const isMatch = await bcrypt.compare(password, ambassador.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // generate token
    const token = jwt.sign({ id: ambassador._id, role: "AMBASSADOR" }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      ambassador: {
        id: ambassador._id,
        fullName: ambassador.fullName,
        email: ambassador.email,
        whatsapp: ambassador.whatsapp,
        status: ambassador.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAmbassadorProfile = async (req, res) => {
  try {
    const ambassador = await Ambassador.findById(req.ambassador.id).select(
      "fullName email whatsapp address dob linkedin course documents.photo"
    );

    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    res.json({ success: true, profile: ambassador });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// UPDATE Ambassador Profile
export const updateAmbassadorProfile = async (req, res) => {
  try {
    const { fullName, dob, linkedin, course, address, photo } = req.body;

    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (dob) updates.dob = dob;
    if (linkedin) updates.linkedin = linkedin;
    if (course) updates.course = course;
    if (address) updates.address = address;
    if (photo) updates["documents.photo"] = photo;

    const ambassador = await Ambassador.findByIdAndUpdate(
      req.ambassador.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("fullName email whatsapp address dob linkedin course documents.photo");

    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    res.json({ success: true, message: "Profile updated successfully", profile: ambassador });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// LOGOUT Ambassador
export const logoutAmbassador = async (req, res) => {
  try {
    // Nothing to clear on backend for JWT
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export const getFormLink = async (req, res) => {
  try {
    const ambassador = await Ambassador.findById(req.ambassador.id).select("formLink");

    if (!ambassador || !ambassador.formLink) {
      return res.status(404).json({
        success: false,
        message: "Form link not assigned yet",
      });
    }

    res.json({
      success: true,
      formLink: ambassador.formLink,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// controller/ambassador.controller.js

/* ----------------- Submit Referral & Custom Form Links ----------------- */
export const submitLinks = async (req, res) => {
  try {
    const { referralLink, customFormLink } = req.body;

    const ambassador = await Ambassador.findByIdAndUpdate(
      req.ambassador.id,
      { referralLink, customFormLink },
      { new: true }
    ).select("fullName email whatsapp referralLink customFormLink");

    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    // ✅ optionally notify admin here
    // await sendLinkSubmissionEmail(ambassador);

    res.json({
      success: true,
      message: "Links submitted successfully",
      ambassador,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


/* ----------------- Submit Activities / Leads Form ----------------- */
export const submitActivitiesFormLink = async (req, res) => {
  try {
    const { activitiesFormLink } = req.body;

    const ambassador = await Ambassador.findByIdAndUpdate(
      req.ambassador.id,
      { activitiesFormLink },
      { new: true }
    ).select("fullName email whatsapp activitiesFormLink");

    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    res.json({
      success: true,
      message: "Activities/Leads form link submitted successfully",
      ambassador,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getActivitiesFormLink = async (req, res) => {
  try {
    const ambassador = await Ambassador.findById(req.ambassador.id).select("activitiesFormLink");

    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    res.json({
      success: true,
      activitiesFormLink: ambassador.activitiesFormLink || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// CHANGE Ambassador Password
export const changeAmbassadorPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // ✅ Validate input
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields (old, new, confirm) are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // ✅ Find ambassador (req.ambassador is set by your auth middleware)
    const ambassador = await Ambassador.findById(req.ambassador.id);
    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    // ✅ Verify old password
    const isMatch = await bcrypt.compare(oldPassword, ambassador.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Old password is incorrect" });
    }

    // ✅ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    ambassador.password = hashedPassword;

    await ambassador.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
