// model/referrals.model.js
import mongoose from "mongoose";

const referralSchema = new mongoose.Schema({
  ambassador: { type: mongoose.Schema.Types.ObjectId, ref: "Ambassador", required: true },
  activityType: { type: String, required: true },   // e.g. Group share
  campaign: { type: String },                       // e.g. Summer Internship
  notes: { type: String },

  whatsappGroupsShared: { type: Number, default: 0 },
  studentsGathered: { type: Number, default: 0 },
  googleFormSubmissions: { type: Number, default: 0 },

  referralLink: { type: String },

  proofs: [String], // uploaded files

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },
  rejectionReason: { type: String },
  reviewedAt: { type: Date },

  createdAt: { type: Date, default: Date.now }
});

const Referral = mongoose.model("Referral", referralSchema);
export default Referral;
