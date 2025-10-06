import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema({
  ambassador: { type: mongoose.Schema.Types.ObjectId, ref: "Ambassador" },

  earned: { type: Number, default: 0 },       // total rewards earned
  withdrawn: { type: Number, default: 0 },    // total rewards withdrawn
  locked: { type: Number, default: 2 },       // always keep last 2 locked
  available: { type: Number, default: 0 },    // earned - withdrawn - locked
  amountLeft: { type: Number, default: 0 },   // available × 300

  updatedAt: { type: Date, default: Date.now }
});

// auto-calc before save
rewardSchema.pre("save", function (next) {
  this.available = Math.max(this.earned - this.withdrawn - this.locked, 0);
  this.amountLeft = this.available * 300; // 👈 difference here
  this.updatedAt = new Date();
  next();
});

const Reward = mongoose.model("Reward", rewardSchema);
export default Reward;

