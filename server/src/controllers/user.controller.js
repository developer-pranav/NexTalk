import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiReq.js";
import { ApiResponse } from "../utils/apiRes.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { uploadOnCloudinary, uploadBufferToCloudinary } from "../utils/cloudinary.js";
import { getRandomDefaultAvatar } from "../config/defaultAvatars.js";
import { sendPasswordResetEmail } from "../utils/email.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
};

const googleLogin = asyncHandler(async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !process.env.GOOGLE_CLIENT_SECRET || !callbackUrl) {
        throw new ApiError(500, "Google OAuth is not configured");
    }

    const state = crypto.randomBytes(32).toString("hex");
    const stateToken = jwt.sign(
        { state },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "10m" }
    );

    const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleUrl.searchParams.set("client_id", clientId);
    googleUrl.searchParams.set("redirect_uri", callbackUrl);
    googleUrl.searchParams.set("response_type", "code");
    googleUrl.searchParams.set("scope", "openid email profile");
    googleUrl.searchParams.set("access_type", "offline");
    googleUrl.searchParams.set("prompt", "select_account");
    googleUrl.searchParams.set("state", stateToken);

    return res.redirect(googleUrl.toString());
});

const googleCallback = asyncHandler(async (req, res) => {
    const { code, state, error } = req.query;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    if (error) {
        return res.redirect(`${clientUrl}/login?googleError=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
        return res.redirect(`${clientUrl}/login?googleError=invalid_request`);
    }

    try {
        jwt.verify(state, process.env.ACCESS_TOKEN_SECRET);
    } catch {
        return res.redirect(`${clientUrl}/login?googleError=invalid_state`);
    }

    try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code: String(code),
                client_id: clientIdOrThrow(),
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_CALLBACK_URL,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenResponse.ok) {
            return res.redirect(`${clientUrl}/login?googleError=token_exchange_failed`);
        }

        const tokenData = await tokenResponse.json();

        const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        if (!profileResponse.ok) {
            return res.redirect(`${clientUrl}/login?googleError=profile_fetch_failed`);
        }

        const profile = await profileResponse.json();
        const email = String(profile.email || "").trim().toLowerCase();
        const fullname = String(profile.name || "").trim();

        if (!email || profile.email_verified !== true) {
            return res.redirect(`${clientUrl}/login?googleError=email_not_verified`);
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            if (!existingUser.avatar) {
                const defaultAvatar = getRandomDefaultAvatar(existingUser.gender);
                if (defaultAvatar) existingUser.avatar = defaultAvatar;
            }

            const accessToken = await existingUser.generateAccessToken();
            const refreshToken = await existingUser.generateRefreshToken();
            existingUser.refreshToken = refreshToken;
            await existingUser.save();

            return res
                .status(302)
                .cookie("accessToken", accessToken, cookieOptions)
                .cookie("refreshToken", refreshToken, cookieOptions)
                .redirect(clientUrl);
        }

        const googleSetupToken = jwt.sign(
            {
                googleId: profile.sub,
                email,
                fullname: fullname || email.split("@")[0],
                avatar: profile.picture || "",
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "10m" }
        );

        const params = new URLSearchParams({
            googleToken: googleSetupToken,
            email,
            fullname: fullname || email.split("@")[0],
        });

        return res.redirect(`${clientUrl}/register?${params.toString()}`);
    } catch (error) {
        console.error("Google OAuth callback failed:", error);
        return res.redirect(`${clientUrl}/login?googleError=oauth_failed`);
    }
});

const clientIdOrThrow = () => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        throw new ApiError(500, "Google OAuth is not configured");
    }
    return process.env.GOOGLE_CLIENT_ID;
};

const checkUsername = asyncHandler(async (req, res) => {
    const username = String(req.query.username || "").trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return res.json(new ApiResponse(200, { available: false }, "Invalid username"));
    }

    const existingUser = await User.exists({ username });

    return res.json(
        new ApiResponse(200, { available: !existingUser }, "Username availability")
    );
});

const googleRegister = asyncHandler(async (req, res) => {
    const { googleToken, username, gender } = req.body;

    if (
        !googleToken ||
        !username?.trim() ||
        !["male", "female"].includes(gender)
    ) {
        throw new ApiError(
            400,
            "Google token, username and gender are required"
        );
    }

    let googleData;

    try {
        googleData = jwt.verify(
            googleToken,
            process.env.ACCESS_TOKEN_SECRET
        );
    } catch {
        throw new ApiError(
            401,
            "Google registration session expired"
        );
    }

    const normalizedUsername = username.trim().toLowerCase();

    const existingUser = await User.findOne({
        $or: [
            { email: googleData.email },
            { username: normalizedUsername },
        ],
    });

    if (existingUser) {
        if (existingUser.email === googleData.email) {
            throw new ApiError(
                409,
                "Email is already registered"
            );
        }

        throw new ApiError(
            409,
            "Username is already taken"
        );
    }


    const randomPassword = crypto
        .randomBytes(32)
        .toString("hex");



    let avatar = null;

    if (googleData.avatar) {
        try {
            const avatarResponse = await fetch(
                String(googleData.avatar),
                {
                    headers: {
                        Accept:
                            "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                    },
                    redirect: "follow",
                }
            );

            if (avatarResponse.ok) {
                const contentType =
                    avatarResponse.headers.get("content-type") || "";

                const contentLength = Number(
                    avatarResponse.headers.get("content-length") || 0
                );


                if (
                    contentType.startsWith("image/") &&
                    (!contentLength ||
                        contentLength <= 10 * 1024 * 1024)
                ) {
                    const imageBuffer = Buffer.from(
                        await avatarResponse.arrayBuffer()
                    );


                    if (imageBuffer.length <= 10 * 1024 * 1024) {
                        const uploadedAvatar =
                            await uploadBufferToCloudinary(
                                imageBuffer,
                                "NexTalk/Avatar",
                                {
                                    mimeType:
                                        contentType.split(";")[0] ||
                                        "image/jpeg",
                                }
                            );

                        avatar =
                            uploadedAvatar?.secure_url || null;
                    }
                }
            }
        } catch (error) {
            console.error(
                "Google avatar import failed:",
                error.message
            );
        }
    }


    if (!avatar) {
        avatar =
            getRandomDefaultAvatar(gender) ||
            undefined;
    }

    const user = await User.create({
        username: normalizedUsername,
        fullname: String(
            googleData.fullname ||
                googleData.email.split("@")[0]
        ).trim(),
        email: googleData.email,
        password: randomPassword,
        gender,
        avatar,
    });



    const accessToken =
        await user.generateAccessToken();

    const refreshToken =
        await user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save();


    const responseUser = user.toObject();

    delete responseUser.password;
    delete responseUser.refreshToken;



    return res
        .status(201)
        .cookie(
            "accessToken",
            accessToken,
            cookieOptions
        )
        .cookie(
            "refreshToken",
            refreshToken,
            cookieOptions
        )
        .json(
            new ApiResponse(
                201,
                responseUser,
                "Google account created"
            )
        );
});

const register = asyncHandler(async (req, res) => {

    const { username, fullname, email, password, gender } = req.body;

    if (
        !username?.trim() ||
        !fullname?.trim() ||
        !email?.trim() ||
        !password?.trim() ||
        !["male", "female"].includes(gender)
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
        password,
        gender,
        avatar: getRandomDefaultAvatar(gender) || undefined
    });

    if (!user.avatar) {
        const defaultAvatar = getRandomDefaultAvatar(user.gender);
        if (defaultAvatar) user.avatar = defaultAvatar;
    }

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

    if (!user.avatar) {
        const defaultAvatar = getRandomDefaultAvatar(user.gender);
        if (defaultAvatar) user.avatar = defaultAvatar;
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

const forgotPassword = asyncHandler(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const genericMessage =
        "If an account exists for this email, a password reset link has been sent.";

    const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
        return res.status(200).json(new ApiResponse(200, {}, genericMessage));
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
        await sendPasswordResetEmail({
            to: user.email,
            name: user.fullname,
            resetUrl,
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        console.error("Password reset email failed:", error);
        throw new ApiError(500, "Unable to send password reset email");
    }

    return res.status(200).json(new ApiResponse(200, {}, genericMessage));
});

const resetPassword = asyncHandler(async (req, res) => {
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");

    if (!token || !password) {
        throw new ApiError(400, "Reset token and new password are required");
    }

    if (password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters");
    }

    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
        throw new ApiError(400, "Password reset link is invalid or expired");
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined;

    await user.save();

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Password reset successfully"));
});

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
    if (!req.user.avatar) {
        const defaultAvatar = getRandomDefaultAvatar(req.user.gender);
        if (defaultAvatar) {
            req.user.avatar = defaultAvatar;
            await req.user.save();
        }
    }

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
        throw new ApiError(
            400,
            "Something went wrong while finding username"
        );
    }

    const user = await User.findOne({ username })
        .select("_id username fullname avatar bio");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "User details fetched successfully"
        )
    );
});

const updateProfile = asyncHandler(async (req, res) => {
    const { fullname, bio } = req.body;

    if (fullname !== undefined) {
        req.user.fullname = fullname.trim();
    }

    if (bio !== undefined) {
        req.user.bio = bio.trim();
    }

    await req.user.save();

    const responseUser = req.user.toObject();

    delete responseUser.password;
    delete responseUser.refreshToken;

    return res.status(200).json(
        new ApiResponse(
            200,
            responseUser,
            "Profile updated successfully"
        )
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(
        req.file.path,
        "NexTalk/Avatar"
    );

    if (!avatar) {
        throw new ApiError(500, "Avatar upload failed");
    }

    req.user.avatar = avatar.secure_url;

    await req.user.save();

    const responseUser = req.user.toObject();

    delete responseUser.password;
    delete responseUser.refreshToken;

    return res.status(200).json(
        new ApiResponse(
            200,
            responseUser,
            "Avatar updated successfully"
        )
    );
});

const removeAvatar = asyncHandler(async (req, res) => {
    const defaultAvatar = getRandomDefaultAvatar(req.user.gender);
    if (!defaultAvatar) {
        throw new ApiError(500, "Default avatars are not configured");
    }

    req.user.avatar = defaultAvatar;

    await req.user.save();

    const responseUser = req.user.toObject();

    delete responseUser.password;
    delete responseUser.refreshToken;

    return res.status(200).json(
        new ApiResponse(
            200,
            responseUser,
            "Profile avatar reset successfully"
        )
    );
});

export {
    register,
    login,
    logout,
    getCurrentUser,
    refreshAccessToken,
    searchUser,
    getUser,
    updateProfile,
    updateAvatar,
    removeAvatar,
    googleLogin,
    googleCallback,
    googleRegister,
    checkUsername,
    forgotPassword,
    resetPassword
}