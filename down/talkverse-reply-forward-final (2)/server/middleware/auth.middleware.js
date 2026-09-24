import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiReq.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized");
    }

    let decoded;

    try {
        decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );
    } catch (error) {
        throw new ApiError(401, "Invalid or expired access token");
    }

    const user = await User.findById(decoded._id);

    if (!user) {
        throw new ApiError(401, "Invalid token");
    }

    req.user = user;
    next();
})