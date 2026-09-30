import { Router } from "express";

import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getPushPublicKey,
    subscribeToPush,
    unsubscribeFromPush,
    getMutedNotificationUsers,
    muteUserNotifications,
    unmuteUserNotifications
} from "../controllers/notification.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
    "/",
    verifyJWT,
    getNotifications
);

router.patch(
    "/:notificationId/read",
    verifyJWT,
    markNotificationRead
);

router.patch(
    "/read-all",
    verifyJWT,
    markAllNotificationsRead
);

router.get(
    "/push/public-key",
    verifyJWT,
    getPushPublicKey
);

router.post(
    "/push/subscribe",
    verifyJWT,
    subscribeToPush
);

router.delete(
    "/push/subscribe",
    verifyJWT,
    unsubscribeFromPush
);

router.get(
    "/mutes",
    verifyJWT,
    getMutedNotificationUsers
);

router.post(
    "/mutes/:userId",
    verifyJWT,
    muteUserNotifications
);

router.delete(
    "/mutes/:userId",
    verifyJWT,
    unmuteUserNotifications
);

export default router;
