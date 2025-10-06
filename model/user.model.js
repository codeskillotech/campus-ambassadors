
import mongoose from "mongoose";

const ambassadorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  whatsapp: { type: String, required: true },
  password: { type: String, required: true },

  // Step 2 fields
  address: {
    area: String,
    district: String,
    police: String,
    state: String,
    pincode: String,
  },
  dob: String,
  linkedin: String,
  collegeId: String,
  course: String,
  semester: String,
  completionYear: String,
  bankAccount: String,
  ifsc: String,
  upiId: String,

  // Step 3 (File URLs - S3, Cloudinary, or local uploads)
  documents: {
    collegeIdCard: String,
    aadharCard: String,
    photo: String,
    bankPassbook: String,
    upiQr: String,
  },

  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  formLink: { type: String },
  referralLink: { type: String },    
  customFormLink: { type: String },
  activitiesFormLink: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Ambassador = mongoose.model("Ambassador", ambassadorSchema);
export default Ambassador;
