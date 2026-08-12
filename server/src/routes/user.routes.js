import { Router } from "express";
import { register, login, logout, getCurrentUser, refreshAccessToken, searchUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

// Routes
router.post("/register", register);
router.post("/login", login);

router.post("/logout", verifyJWT, logout);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", verifyJWT, getCurrentUser);

router.get("/search", verifyJWT, searchUser);

export default router