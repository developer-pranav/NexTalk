import { Router } from "express";

import {
    sendFriendRequest,
    getFriendRequests,
    getMyConnections,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    blockUser,
    unblockUser,
    getBlockedUsers,
} from "../controllers/connection.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Get all my connections
router.get(
    "/",
    verifyJWT,
    getMyConnections
);

// Send friend request
router.post(
    "/request/:userId",
    verifyJWT,
    sendFriendRequest
);

// Get received friend requests
router.get(
    "/requests",
    verifyJWT,
    getFriendRequests
);

// Cancel sent friend request
router.delete(
    "/request/:requestId/cancel",
    verifyJWT,
    cancelFriendRequest
);

// Accept friend request
router.patch(
    "/request/:requestId/accept",
    verifyJWT,
    acceptFriendRequest
);

// Reject friend request
router.patch(
    "/request/:requestId/reject",
    verifyJWT,
    rejectFriendRequest
);

// Block user
router.post(
    "/block/:userId",
    verifyJWT,
    blockUser
);

// Get blocked users
router.get(
    "/blocked",
    verifyJWT,
    getBlockedUsers
);

// Unblock user
router.delete(
    "/block/:userId",
    verifyJWT,
    unblockUser
);

export default router;