import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["SUPER_ADMIN", "ADMIN"], default: "ADMIN" },
  resetOtp: { type: String }, // OTP stored as string
  resetOtpExpire: { type: Date }, // Expiry timestamp
  formLink: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
