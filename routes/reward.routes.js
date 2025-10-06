import express from "express";
import {
  addReward,
  getAmbassadorRewards,
  getAllRewards,
  updateReward,
  requestWithdrawal,
  approveWithdrawal,
  getRewardById,
  getPendingRewardWithdrawals
} from "../controller/reward.controller.js";
import { isAdmin } from "../middleware/auth.js";
import { isAmbassador } from "../middleware/authAmbassador.js";

const router = express.Router();

router.post("/add", isAdmin, addReward);
router.get("/me", isAmbassador, getAmbassadorRewards);
router.get("/all", isAdmin, getAllRewards);
router.get("/:rewardId", isAdmin, getRewardById);
router.put("/:rewardId", isAdmin, updateReward);
router.post("/withdraw", isAmbassador, requestWithdrawal);
router.get("/withdraw/pending", isAdmin, getPendingRewardWithdrawals);
router.put("/withdraw/:requestId/approve", isAdmin, approveWithdrawal);

export default router;
