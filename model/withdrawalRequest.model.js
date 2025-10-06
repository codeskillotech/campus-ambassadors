import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema({
  ambassador: { type: mongoose.Schema.Types.ObjectId, ref: "Ambassador" },
  type: { type: String, enum: ["coupon", "reward"], required: true },
  couponsRequested: { type: Number, default: 0 },
  rewardsRequested: { type: Number, default: 0 }, // 👈 new field
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date }
});
const WithdrawalRequest = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
export default WithdrawalRequest;