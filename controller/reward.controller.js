import Reward from "../model/reward.model.js";
import Ambassador from "../model/user.model.js";
import WithdrawalRequest from "../model/withdrawalRequest.model.js";

/* ========== Admin: Add/Update Rewards by Email ========== */
export const addReward = async (req, res) => {
  try {
    const { ambassadorName, email, count } = req.body;

    if (!email || !count) {
      return res.status(400).json({ success: false, message: "Email and count are required" });
    }

    const ambassador = await Ambassador.findOne({ email });
    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found" });
    }

    let reward = await Reward.findOne({ ambassador: ambassador._id });

    if (!reward) {
      reward = new Reward({ ambassador: ambassador._id, earned: count });
    } else {
      reward.earned += count;
    }

    await reward.save();

    res.status(201).json({
      success: true,
      message: "Reward entry added/updated successfully",
      reward: {
        id: reward._id,
        ambassadorId: ambassador._id,
        ambassadorName: ambassadorName || ambassador.name,
        email: ambassador.email,
        earned: reward.earned,
        withdrawn: reward.withdrawn,
        available: reward.available,
        amountLeft: reward.amountLeft,
        updatedAt: reward.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ========== Ambassador: Get Own Rewards ========== */
export const getAmbassadorRewards = async (req, res) => {
  try {
    const ambassadorId = req.ambassador.id;

    const reward = await Reward.findOne({ ambassador: ambassadorId })
      .populate("ambassador", "name email");

    if (!reward) {
      return res.status(404).json({ success: false, message: "No rewards found" });
    }

    res.status(200).json({
      success: true,
      reward: {
        id: reward._id,
        ambassadorId: reward.ambassador._id,
        ambassadorName: reward.ambassador.name,
        email: reward.ambassador.email,
        earned: reward.earned,
        withdrawn: reward.withdrawn,
        locked: reward.locked,
        available: reward.available,
        amountLeft: reward.amountLeft,
        updatedAt: reward.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ========== Admin: Get All Rewards ========== */
export const getAllRewards = async (req, res) => {
  try {
    const rewards = await Reward.find()
      .populate("ambassador", "name email")
      .sort({ updatedAt: -1 });

    const formatted = rewards.map(r => ({
      id: r._id,
      ambassadorId: r.ambassador._id,
      ambassadorName: r.ambassador.name,
      email: r.ambassador.email,
      earned: r.earned,
      withdrawn: r.withdrawn,
      locked: r.locked,
      available: r.available,
      left: r.earned - r.withdrawn,
      amountLeft: r.amountLeft,
      updatedAt: r.updatedAt
    }));

    res.status(200).json({ success: true, rewards: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ========== Admin: Get Single Reward by ID ========== */
export const getRewardById = async (req, res) => {
  try {
    const { rewardId } = req.params;

    const reward = await Reward.findById(rewardId).populate("ambassador", "name fullName username email");
    if (!reward) {
      return res.status(404).json({ success: false, message: "Reward not found" });
    }

    // pick ambassador name safely
    const ambassadorName =
      reward.ambassador.fullName ||
      reward.ambassador.name ||
      reward.ambassador.username ||
      "Unknown";

    res.status(200).json({
      success: true,
      reward: {
        id: reward._id,
        ambassadorId: reward.ambassador._id,
        ambassadorName,
        email: reward.ambassador.email,
        earned: reward.earned,
        withdrawn: reward.withdrawn,
        locked: reward.locked,
        available: reward.available,
        amountLeft: reward.amountLeft,
        updatedAt: reward.updatedAt
      }
    });
  } catch (error) {
    console.error("Get reward error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ========== Admin: Update Reward ========== */
export const updateReward = async (req, res) => {
  try {
    const { rewardId } = req.params;
    const { ambassadorName, email, count } = req.body;

    let reward = await Reward.findById(rewardId).populate("ambassador", "name fullName email");
    if (!reward) {
      return res.status(404).json({ success: false, message: "Reward not found" });
    }

    // Update ambassador details if provided
    if (ambassadorName || email) {
      await Ambassador.findByIdAndUpdate(
        reward.ambassador._id,
        { ...(ambassadorName && { fullName: ambassadorName }), ...(email && { email }) },
        { new: true }
      );
    }

    // Update earned count
    if (count !== undefined) {
      reward.earned = count;
      await reward.save(); // triggers pre('save') -> recalculates available & amountLeft
    }

    // ✅ Re-fetch fresh data from DB
    reward = await Reward.findById(rewardId).populate("ambassador", "name fullName email");

    res.status(200).json({
      success: true,
      message: "Reward updated successfully",
      reward: {
        ambassadorName: reward.ambassador.fullName || reward.ambassador.name,
        email: reward.ambassador.email,
        count: reward.earned,
        available: reward.available,
        amountLeft: reward.amountLeft,
        updatedAt: reward.updatedAt
      }
    });
  } catch (error) {
    console.error("Update reward error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


/* ========== Ambassador: Request Withdrawal ========== */
export const requestWithdrawal = async (req, res) => {
  try {
    const ambassadorId = req.ambassador.id;
    const { count } = req.body;

    const reward = await Reward.findOne({ ambassador: ambassadorId });
    if (!reward) return res.status(404).json({ success: false, message: "No rewards found" });

    const maxWithdrawable = Math.max(reward.earned - reward.withdrawn - reward.locked, 0);

    if (!count || count <= 0) return res.status(400).json({ success: false, message: "Invalid withdrawal count" });

    if (count > maxWithdrawable) {
      return res.status(400).json({
        success: false,
        message: `You have earned ${reward.earned} rewards. ${reward.locked} are locked, so you can withdraw only up to ${maxWithdrawable}.`
      });
    }

   const newRequest = new WithdrawalRequest({
  ambassador: ambassadorId,
  type: "reward", // 👈 ensure marked as reward
  rewardsRequested: count, // rename later if you want -> rewardsRequested
  amount: count * 300
});

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: `Withdrawal request of ${count} rewards submitted successfully.`,
      request: newRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


/* ========== Admin: Get Pending Rewards Withdrawal Requests ========== */
export const getPendingRewardWithdrawals = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find({ status: "pending", type: "reward" }) // 👈 filter by reward
      .populate("ambassador", "name email")
      .sort({ createdAt: -1 });

    const formatted = requests.map(r => ({
      id: r._id,
      ambassadorId: r.ambassador._id,
      ambassadorName: r.ambassador.name,
      email: r.ambassador.email,
      rewardsRequested:r.rewardsRequested, // if you rename, change to r.rewardsRequested
      amount: r.amount,
      status: r.status,
      createdAt: r.createdAt
    }));

    res.status(200).json({ success: true, requests: formatted });
  } catch (error) {
    console.error("Get pending reward withdrawals error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


/* ========== Admin: Approve Withdrawal ========== */
/* ========== Admin: Approve Reward Withdrawal ========== */
export const approveWithdrawal = async (req, res) => {
  try {
    const { requestId } = req.params;

    // 1. Find request
    const request = await WithdrawalRequest.findById(requestId).populate("ambassador", "name email");
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ success: false, message: "Already processed" });
    if (request.type !== "reward") return res.status(400).json({ success: false, message: "Not a reward request" });

    // 2. Find reward record
    const reward = await Reward.findOne({ ambassador: request.ambassador._id });
    if (!reward) return res.status(404).json({ success: false, message: "Reward record not found" });

    // 3. Update withdrawn count
    reward.withdrawn += request.rewardsRequested;   // 👈 use rewardsRequested
    await reward.save(); // triggers pre('save') → recalculates available & amountLeft

    // 4. Mark request approved
    request.status = "approved";
    request.approvedAt = new Date();
    await request.save();

    // 5. Send back updated data
    res.status(200).json({
      success: true,
      message: "Reward withdrawal approved",
      request: {
        id: request._id,
        ambassadorName: request.ambassador.name,
        email: request.ambassador.email,
        rewardsRequested: request.rewardsRequested,
        amount: request.amount,
        status: request.status,
        approvedAt: request.approvedAt
      },
      reward: {
        id: reward._id,
        ambassadorId: reward.ambassador,
        earned: reward.earned,
        withdrawn: reward.withdrawn,
        locked: reward.locked,
        available: reward.available,
        amountLeft: reward.amountLeft,
        updatedAt: reward.updatedAt
      }
    });
  } catch (error) {
    console.error("Approve reward withdrawal error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

