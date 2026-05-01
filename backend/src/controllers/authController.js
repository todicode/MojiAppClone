import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 20 * 60 * 60 * 1000; // 14 days in milliseconds

export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;

        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user already exists
        const duplicate = await User.findOne({username});
        if (duplicate) {
            return res.status(409).json({ message: "Username already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // Create new user
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${firstName} ${lastName}`
        });

        // return response
        return res.sendStatus(204);
    }
    catch (error) {
        console.error("Error during sign up:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const signIn = async (req, res) => {
    try {
        // Get input
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        // Get hashed password from database and compare
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: "Username or password is incorrect" });
        }

        // Compare password
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

        if (!passwordCorrect) {
            return res.status(401).json({ message: "Username or password is incorrect" });
        }

        // if fit, create access token with JWT
        const accessToken = jwt.sign(
            { userId: user._id }, 
            process.env.ACCESS_TOKEN_SECRET, 
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        // create refresh token
        const refreshToken = crypto.randomBytes(64).toString("hex"); // Generate a random refresh token

        // create new session in database with refresh token
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL) // Set expiration time for the refresh token
        });

        // return refresh token in cookies
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true, // set to true if deploy with https
            sameSite: "none", // deploy backend and frontend separately, set to "strict" if deploy together
            maxAge: REFRESH_TOKEN_TTL
        });
        // return access token in response
        return res.status(200).json({ message: `User ${user.displayName} signed in successfully`, accessToken });
    }
    catch (error) {
        console.error("Error during sign in:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const signOut = async (req, res) => {
    try {
        // Get refresh token from cookies
        const token = req.cookies?.refreshToken;
        if (token) {
            // Clear the refresh token from sessions collection
            await Session.deleteOne({ refreshToken: token });

            // clear cookies
            res.clearCookie("refreshToken");
        }

        return res.sendStatus(204);
    }
    catch (error) {
        console.error("Error during sign out:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};