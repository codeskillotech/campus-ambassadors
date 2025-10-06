import express from "express";
import { addCoupon, approveWithdrawal, getAllCoupons, getAmbassadorCoupons, getCouponById, getPendingWithdrawals, requestWithdrawal, updateCoupon } from "../controller/coupon.controller.js";
import { isAdmin } from "../middleware/auth.js";
import { isAmbassador } from "../middleware/authAmbassador.js";
const router = express.Router();

// Admin adds coupon entry
router.post("/addCoupon", isAdmin, addCoupon);
router.get("/me", isAmbassador, getAmbassadorCoupons);

router.get("/allcoupon", isAdmin, getAllCoupons);
router.get("/:couponId", isAdmin, getCouponById);
router.put("/:couponId", isAdmin, updateCoupon);
router.post("/withdraw", isAmbassador, requestWithdrawal);
router.get("/withdraw/pending", isAdmin, getPendingWithdrawals);
router.put("/withdraw/:requestId/approve", isAdmin, approveWithdrawal);
export default router;
