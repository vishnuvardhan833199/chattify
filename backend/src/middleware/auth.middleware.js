import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Get JWT token from cookies
    const token = req.cookies?.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    // Find user from DB
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
