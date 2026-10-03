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
    unfriendUser,
} from "../controllers/connection.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();


router.get(
    "/",
    verifyJWT,
    getMyConnections
);


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


router.delete(
    "/request/:requestId/cancel",
    verifyJWT,
    cancelFriendRequest
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


router.get(
    "/blocked",
    verifyJWT,
    getBlockedUsers
);


router.delete(
    "/block/:userId",
    verifyJWT,
    unblockUser
);


router.delete(
    "/unfriend/:userId",
    verifyJWT,
    unfriendUser
);


export default router;