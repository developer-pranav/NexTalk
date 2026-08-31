import { Router } from "express";
import {
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    blockUser,
    unblockUser
} from "../controllers/connection.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.post(
    "/request/:userId",
    verifyJWT,
    sendFriendRequest
);

router.get(
    "/requests",
    verifyJWT,
    getFriendRequests
);

router.patch(
    "/request/:requestId/accept",
    verifyJWT,
    acceptFriendRequest
);

router.patch(
    "/request/:requestId/reject",
    verifyJWT,
    rejectFriendRequest
);

router.post(
    "/block/:userId",
    verifyJWT,
    blockUser
);

router.delete(
    "/block/:userId",
    verifyJWT,
    unblockUser
);

export default router