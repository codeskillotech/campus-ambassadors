import express from "express";
import {
  submitReferral,
  getAllReferrals,
  getReferralById,
  approveReferral,
  rejectReferral,
  getMyReferrals
} from "../controller/referrals.controller.js";

import { isAdmin } from "../middleware/auth.js";
import { isAmbassador } from "../middleware/authAmbassador.js";
const router = express.Router();

/* Ambassador routes */
router.post("/submmit", isAmbassador, submitReferral);
router.get("/my", isAmbassador, getMyReferrals);
/* Admin routes */
router.get("/", isAdmin, getAllReferrals);
router.get("/:id", isAdmin, getReferralById);
router.put("/:id/approve", isAdmin, approveReferral);
router.put("/:id/reject", isAdmin, rejectReferral);

export default router;
