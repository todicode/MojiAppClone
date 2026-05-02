export const authMe = (req, res) => {
    try {
        const user = req.user; // Get user from request object (set by auth middleware)
        return res.status(200).json({ user });
    }
    catch (error) {
        console.error("Error in authMe:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};