import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  ambassador: { type: mongoose.Schema.Types.ObjectId, ref: "Ambassador" },

  earned: { type: Number, default: 0 },       // total coupons earned
  withdrawn: { type: Number, default: 0 },    // total coupons withdrawn
  locked: { type: Number, default: 2 },       // always keep last 2 locked
  available: { type: Number, default: 0 },    // earned - withdrawn - locked
  amountLeft: { type: Number, default: 0 },   // available × 200

  updatedAt: { type: Date, default: Date.now }
});

// auto-calc fields before save
couponSchema.pre("save", function (next) {
  this.available = Math.max(this.earned - this.withdrawn - this.locked, 0);
  this.amountLeft = this.available * 200;
  this.updatedAt = new Date();
  next();
});

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
