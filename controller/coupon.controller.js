import Coupon from "../model/coupon.model.js";
import Ambassador from "../model/user.model.js";
import WithdrawalRequest from "../model/withdrawalRequest.model.js";


/* ========== Admin: Add/Update Coupons by Email ========== */
export const addCoupon = async (req, res) => {
  try {
    const { ambassadorName, email, count } = req.body;

    // validate required fields
    if (!email || !count) {
      return res.status(400).json({ success: false, message: "Email and count are required" });
    }

    // find ambassador by email
    const ambassador = await Ambassador.findOne({ email });
    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    // find existing coupon record
    let coupon = await Coupon.findOne({ ambassador: ambassador._id });

    if (!coupon) {
      coupon = new Coupon({
        ambassador: ambassador._id,
        earned: count
      });
    } else {
      coupon.earned += count; // add new coupons
    }

    await coupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon entry added/updated successfully",
      coupon: {
        id: coupon._id,
        ambassadorId: ambassador._id,
        ambassadorName: ambassadorName || ambassador.name,
        email: ambassador.email,
        earned: coupon.earned,
        withdrawn: coupon.withdrawn,
        available: coupon.available,
        amountLeft: coupon.amountLeft,
        updatedAt: coupon.updatedAt
      }
    });
  } catch (error) {
    console.error("Add coupon error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


/* ========== Ambassador: Get Own Coupon Details ========== */
export const getAmbassadorCoupons = async (req, res) => {
  try {
    // ambassadorId comes from decoded token
    const ambassadorId = req.ambassador.id;

    // find coupon record for this ambassador
    const coupon = await Coupon.findOne({ ambassador: ambassadorId })
      .populate("ambassador", "name email");

    if (!coupon) {
      return res.status(404).json({ success: false, message: "No coupons found for this ambassador" });
    }

    res.status(200).json({
      success: true,
      coupon: {
        id: coupon._id,
        ambassadorId: coupon.ambassador._id,
        ambassadorName: coupon.ambassador.name,
        email: coupon.ambassador.email,
        earned: coupon.earned,
        withdrawn: coupon.withdrawn,
        locked: coupon.locked,
        available: coupon.available,
        amountLeft: coupon.amountLeft,
        updatedAt: coupon.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};



/* ========== Admin: Get All Coupon Records ========== */
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate("ambassador", "name email") // get ambassador name + email
      .sort({ updatedAt: -1 });

    const formatted = coupons.map(coupon => ({
      id: coupon._id,
      ambassadorId: coupon.ambassador._id,
      ambassadorName: coupon.ambassador.name,
      email: coupon.ambassador.email,
      earned: coupon.earned,
      withdrawn: coupon.withdrawn,
      locked: coupon.locked,
      available: coupon.available,
      left: coupon.earned - coupon.withdrawn,  // quick calculation for "Left"
      amountLeft: coupon.amountLeft,
      updatedAt: coupon.updatedAt
    }));

    res.status(200).json({ success: true, coupons: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


/* ========== Admin: Get Single Coupon by ID ========== */
export const getCouponById = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId).populate("ambassador", "name fullName username email");
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    // fallback for name
    const ambassadorName = coupon.ambassador.name 
                        || coupon.ambassador.fullName 
                        || coupon.ambassador.username 
                        || "Unknown";

    res.status(200).json({
      success: true,
      coupon: {
        ambassadorName,
        email: coupon.ambassador.email,
        count: coupon.earned
      }
    });
  } catch (error) {
    console.error("Get coupon error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ========== Admin: Update Coupon ========== */
export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const { ambassadorName, email, count } = req.body;

    let coupon = await Coupon.findById(couponId).populate("ambassador", "name fullName email");
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    // update Ambassador details if provided
    if (ambassadorName || email) {
      await Ambassador.findByIdAndUpdate(
        coupon.ambassador._id,
        {
          ...(ambassadorName && { fullName: ambassadorName }),
          ...(email && { email })
        },
        { new: true }
      );
    }

    // update coupon count if provided
    if (count !== undefined) {
      coupon.earned = count;
      await coupon.save();
    }

    // re-populate to get fresh ambassador data
    coupon = await Coupon.findById(couponId).populate("ambassador", "name fullName email");

    // pick name safely
    const nameToShow = coupon.ambassador.fullName || coupon.ambassador.name || "Unknown";

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon: {
        ambassadorName: nameToShow,
        email: coupon.ambassador.email,
        count: coupon.earned
      }
    });
  } catch (error) {
    console.error("Update coupon error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



export const requestWithdrawal = async (req, res) => {
  try {
    const ambassadorId = req.ambassador.id;
    const { count } = req.body; // number of coupons ambassador wants to withdraw

    // find coupon record
    const coupon = await Coupon.findOne({ ambassador: ambassadorId });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "No coupons found" });
    }

    // calculate max withdrawable (earned - withdrawn - locked)
    const maxWithdrawable = Math.max(coupon.earned - coupon.withdrawn - coupon.locked, 0);

    // 🛑 no coupons available
    if (maxWithdrawable <= 0) {
      return res.status(400).json({
        success: false,
        message: `You cannot withdraw right now. At least ${coupon.locked} coupons must always remain locked.`
      });
    }

    // 🛑 invalid request
    if (!count || count <= 0) {
      return res.status(400).json({ success: false, message: "Invalid withdrawal count" });
    }

    // 🛑 trying to take more than allowed
    if (count > maxWithdrawable) {
      return res.status(400).json({
        success: false,
        message: `You have earned ${coupon.earned} coupons. As per policy, ${coupon.locked} are locked, so you can withdraw only up to ${maxWithdrawable} coupons.`
      });
    }

    // ✅ create request (pending approval by admin)
    const newRequest = new WithdrawalRequest({
      ambassador: ambassadorId,
      type: "coupon",
      couponsRequested: count,
      amount: count * 200
    });
    await newRequest.save();

    res.status(201).json({
      success: true,
      message: `Withdrawal request of ${count} coupon(s) submitted successfully. (${coupon.locked} coupons remain locked as per policy.)`,
      request: {
        id: newRequest._id,
        ambassadorId,
        couponsRequested: newRequest.couponsRequested,
        amount: newRequest.amount,
        status: newRequest.status,
        createdAt: newRequest.createdAt
      }
    });
  } catch (error) {
    console.error("Request withdrawal error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



export const getPendingWithdrawals = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find({ status: "pending" })
      .populate("ambassador", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: requests.map(r => ({
        id: r._id,
        ambassadorId: r.ambassador._id,
        ambassadorName: r.ambassador.name,
        email: r.ambassador.email,
        couponsRequested: r.couponsRequested,
        amount: r.amount,
        status: r.status,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const approveWithdrawal = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await WithdrawalRequest.findById(requestId).populate("ambassador", "name email");
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "Request already processed" });
    }

    // update coupon record
    const coupon = await Coupon.findOne({ ambassador: request.ambassador._id });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon record not found" });
    }

    coupon.withdrawn += request.couponsRequested;
    await coupon.save();

    // mark request approved
    request.status = "approved";
    request.approvedAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: "Withdrawal approved",
      request: {
        id: request._id,
        ambassadorName: request.ambassador.name,
        email: request.ambassador.email,
        couponsRequested: request.couponsRequested,
        amount: request.amount,
        status: request.status,
        approvedAt: request.approvedAt
      },
      coupon: {
        earned: coupon.earned,
        withdrawn: coupon.withdrawn,
        locked: coupon.locked,
        available: coupon.available,
        amountLeft: coupon.amountLeft
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
