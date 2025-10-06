import express from "express";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import templateRoutes from "./routes/template.routes.js";
import referralRoutes from "./routes/referrals.routes.js";
import couponRoutes from "./routes/coupon.routes.js"
import rewardRoutes from "./routes/reward.routes.js"

import dotenv from "dotenv";
dotenv.config();


const app = express();
app.use(cors());
// Middleware
app.use(express.json());

// Database connection
connectDB();

app.use("/api/user", userRoutes );
app.use("/api/admin", adminRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/rewards", rewardRoutes);

// Sample Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
