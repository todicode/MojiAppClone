import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectedRoute = async (req, res, next) => {
    try {
        // Get token from headers
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

        if (!token) {
            return res.status(401).json({ message: "Access token is missing" });
        }
        // Verify token
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
            // Get user from database
            if (err) {
                return res.status(403).json({ message: "Invalid or expired access token" });
            }
            const user = await User.findById(decodedUser.userId).select("-hashedPassword"); // Exclude hashed password

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Attach user to request object
            req.user = user;
            next();
        });
    }
    catch (error) {
        console.error("Error in protectedRoute:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};