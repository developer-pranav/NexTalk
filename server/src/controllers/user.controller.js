import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiReq.js";
import { ApiResponse } from "../utils/apiRes.js";
import jwt from "jsonwebtoken";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
};

const register = asyncHandler(async (req, res) => {

    const { username, fullname, email, password } = req.body;

    if (
        !username?.trim() ||
        !fullname?.trim() ||
        !email?.trim() ||
        !password?.trim()
    ) {
        throw new ApiError(400, "All details are required fields");
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        if (existingUser.email === email) {
            throw new ApiError(409, "Email is already registered");
        }

        if (existingUser.username === username) {
            throw new ApiError(409, "Username is already taken");
        }
    }

    const user = await User.create({
        username,
        fullname,
        email,
        password
    });

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    if (!user) throw new ApiError(500, "Something went wrong while registering User");

    const responseUser = user.toObject();

    delete responseUser.password;
    delete responseUser.refreshToken;

    return res
        .status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(201, responseUser, "User created")
        );
})

const login = asyncHandler(async (req, res) => {
    const { usernameEmail, password } = req.body;

    if (!usernameEmail?.trim() || !password?.trim()) {
        throw new ApiError(400, "All details are required fields");
    }

    const user = await User.findOne(
        {
            $or: [
                { email: usernameEmail },
                { username: usernameEmail }
            ]
        }
    ).select("+password");

    if (!user) {
        throw new ApiError(401, "Invalid username/email or password");
    }

    const passwordCorrect = await user.isPasswordCorrect(password);

    if (!passwordCorrect) {
        throw new ApiError(401, "Invalid username/email or password");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    const responseUser = user.toObject();

    delete responseUser.password;
    delete responseUser.refreshToken;

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, responseUser, "User login successfully")
        );
})

const logout = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        }
    );
    return res
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(
                200,
                {},
                "Logout success"
            )
        );
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.json(
        new ApiResponse(
            200,
            req.user,
            "Current User"
        )
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    let decodedToken;

    try {
        decodedToken = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decodedToken._id)
        .select("+refreshToken");

    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    if (user.refreshToken !== refreshToken) {
        throw new ApiError(401, "Refresh token is invalid");
    }

    const accessToken = user.generateAccessToken();

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {},
                "Access token refreshed successfully"
            )
        );
})

const searchUser = asyncHandler(async (req, res) => {
    const { username } = req.query;

    if (!username?.trim()) {
        throw new ApiError(400, "Search box is empty");
    }

    const users = await User.find({
        username: {
            $regex: username,
            $options: "i"
        }
    }).select("_id username fullname avatar");

    return res.status(200).json(
        new ApiResponse(200, users, "Users fetched successfully")
    );
})

const getUser = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "Something went wrong while finding username");
    }

    const user = await User.findOne(username);

    return res.status(200).json(
        new ApiResponse(200, user, "User details fetched successfully")
    );
})

export {
    register,
    login,
    logout,
    getCurrentUser,
    refreshAccessToken,
    searchUser
}