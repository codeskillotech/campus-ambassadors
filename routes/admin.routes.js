// routes/admin.routes.js
import express from "express";
import { registerAdmin, loginAdmin, getPendingAmbassadors, getAmbassadorById, approveAmbassador, rejectAmbassador, forgotPasswordOtp, resetPasswordWithOtp, changePassword, logoutAdmin, getApprovedAmbassadors, assignFormLink, getAmbassadorsWithLinks, getAmbassadorsWithActivitiesForm } from "../controller/admin.controller.js";
import { isAdmin } from "../middleware/auth.js"
const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/forgot-password", forgotPasswordOtp);
router.post("/reset-password", resetPasswordWithOtp);
router.post("/change-password",isAdmin, changePassword);
router.get("/ambassadors/pending", isAdmin, getPendingAmbassadors);
router.get("/ambassador/:id", isAdmin, getAmbassadorById);
router.get("/ambassadors/approved", isAdmin, getApprovedAmbassadors);
router.put("/ambassador/:id/approve", isAdmin, approveAmbassador);
router.put("/ambassador/:id/reject", isAdmin, rejectAmbassador);
router.post("/logoutAdmin", isAdmin, logoutAdmin);
router.put("/ambassador/:id/form-link", isAdmin, assignFormLink);
router.get("/ambassadors/links", isAdmin, getAmbassadorsWithLinks);
router.get("/ambassadors/activities-forms", isAdmin, getAmbassadorsWithActivitiesForm);
export default router;
