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
    getUser
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router()

// Routes
router.post("/register", register);
router.post("/login", login);

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

export default router