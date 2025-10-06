import Referral from "../model/referrals.model.js";

export const submitReferral = async (req, res) => {
  try {
    if (!req.ambassador || !req.ambassador.id) {
      return res.status(400).json({ success: false, error: "Ambassador not authenticated" });
    }

    const referral = new Referral({
      ambassador: req.ambassador.id,   // ✅ use ambassador
      ...req.body
    });

    await referral.save();

    res.status(201).json({
      success: true,
      message: "Referral submitted successfully",
      referral
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyReferrals = async (req, res) => {
  try {
    if (!req.ambassador?.id) {
      return res.status(400).json({ success: false, error: "Ambassador not authenticated" });
    }

    const referrals = await Referral.find({ ambassador: req.ambassador.id }).sort({ createdAt: -1 });
    res.json({ success: true, referrals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ----------------- Admin fetch all referrals ----------------- */
export const getAllReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate("ambassador", "name email") // show ambassador name & email
      .sort({ createdAt: -1 });

    res.json({ success: true, referrals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ----------------- Admin fetch single referral ----------------- */
export const getReferralById = async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id)
      .populate("ambassador", "name email");

    if (!referral) {
      return res.status(404).json({ success: false, message: "Referral not found" });
    }

    res.json({ success: true, referral });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ----------------- Admin approve referral ----------------- */
export const approveReferral = async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({ success: false, message: "Referral not found" });
    }

    referral.status = "APPROVED";
    referral.reviewedAt = new Date();
    referral.rejectionReason = null;

    await referral.save();

    res.json({
      success: true,
      message: "Referral approved successfully",
      referral
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ----------------- Admin reject referral ----------------- */
export const rejectReferral = async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({ success: false, message: "Referral not found" });
    }

    referral.status = "REJECTED";
    referral.rejectionReason = req.body.reason || "No reason provided";
    referral.reviewedAt = new Date();

    await referral.save();

    res.json({
      success: true,
      message: "Referral rejected",
      referral
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
