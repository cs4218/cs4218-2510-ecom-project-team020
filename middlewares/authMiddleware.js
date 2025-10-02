import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
    try {
        const decode = JWT.verify(
            req.headers.authorization,
            process.env.JWT_SECRET
        );
        req.user = decode;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).send({
            success: false,
            message: "Unauthorized Access",
        });
    }
};

//admin access
export const isAdmin = async (req, res, next) => {
    try {
        if (!req.user?._id) {
            return res.status(401).send({
                success: false,
                message: "Unauthorized Access",
            });
        }

        const user = await userModel.findById(req.user._id);

        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User not found",
            });
        }

        if (user.role !== 1) {
            return res.status(403).send({
                success: false,
                message: "Forbidden",
            });
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Something went wrong",
        });
    }
};