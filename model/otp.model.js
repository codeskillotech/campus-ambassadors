import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 300s = 5 min TTL
});

// After 5 minutes, MongoDB auto-deletes the OTP
const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
