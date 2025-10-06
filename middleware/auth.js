// middleware/auth.js
import jwt from "jsonwebtoken";

export const isAdmin = (req, res, next) => {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Format: "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Invalid token format" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure user is ADMIN or SUPER_ADMIN
    if (!decoded || (decoded.role !== "ADMIN" && decoded.role !== "SUPER_ADMIN")) {
      return res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }

    // Attach admin info to req
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized", error: error.message });
  }
};
