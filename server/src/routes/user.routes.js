import { Router } from "express";
import {
    register,
    login,
    logout,
    getCurrentUser,
    refreshAccessToken,
    searchUser,
    updateProfile,
    updateAvatar,
    removeAvatar,
    getUser,
    googleLogin,
    googleCallback,
    googleRegister,
    checkUsername,
    forgotPassword,
    resetPassword
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router()


router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);
router.post("/google/register", googleRegister);
router.get("/check-username", checkUsername);


router.post("/register", register);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/logout", verifyJWT, logout);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", verifyJWT, getCurrentUser);
router.get("/search", verifyJWT, searchUser);
router.get("/:username", verifyJWT, getUser);

router.patch(
    "/me",
    verifyJWT,
    updateProfile
);

router.patch(
    "/me/avatar",
    verifyJWT,
    upload.single("avatar"),
    updateAvatar
);

router.delete(
    "/me/avatar",
    verifyJWT,
    removeAvatar
);

export default router