import express from "express";
import { isAmbassador } from "../middleware/authAmbassador.js"
import upload from "../middleware/upload.js";
import {
  sendOtp,
  verifyOtp,
  registerAmbassador,
  loginAmbassador,
  getAmbassadorProfile,
  updateAmbassadorProfile,
  logoutAmbassador,
  getFormLink,
  submitLinks,
  submitActivitiesFormLink,
  getActivitiesFormLink,
  changeAmbassadorPassword,
  
} from "../controller/user.controller.js"; // include .js

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", registerAmbassador);
router.post("/login", loginAmbassador);
router.get("/profile", isAmbassador, getAmbassadorProfile);
router.get("/form-link", isAmbassador, getFormLink);
router.put("/updateprofile", isAmbassador, updateAmbassadorProfile);
router.post("/logout", isAmbassador, logoutAmbassador);
router.post("/links", isAmbassador, submitLinks);
router.post("/form-link/activities", isAmbassador, submitActivitiesFormLink);
router.get("/form-link/activities", isAmbassador, getActivitiesFormLink);
router.post("/change-password", isAmbassador, changeAmbassadorPassword);
export default router;
