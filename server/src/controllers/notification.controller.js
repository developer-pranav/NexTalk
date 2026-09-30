import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiReq.js";
import { ApiResponse } from "../utils/apiRes.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { getVapidPublicKey } from "../utils/pushNotification.js";

const getNotifications = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 30, 1), 100);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find({ recipient: req.user._id })
            .populate("sender", "username fullname avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Notification.countDocuments({ recipient: req.user._id }),
        Notification.countDocuments({
            recipient: req.user._id,
            isRead: false,
        }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                notifications,
                unreadCount,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: page * limit < total,
                },
            },
            "Notifications fetched successfully"
        )
    );
});

const markNotificationRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
        {
            _id: notificationId,
            recipient: req.user._id,
        },
        { $set: { isRead: true } },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res.status(200).json(
        new ApiResponse(200, notification, "Notification marked as read")
    );
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        {
            recipient: req.user._id,
            isRead: false,
        },
        { $set: { isRead: true } }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "All notifications marked as read")
    );
});

const getPushPublicKey = asyncHandler(async (req, res) => {
    const publicKey = getVapidPublicKey();

    if (!publicKey) {
        throw new ApiError(503, "Web Push is not configured on the server");
    }

    return res.status(200).json(
        new ApiResponse(200, { publicKey }, "Push public key fetched successfully")
    );
});

const subscribeToPush = asyncHandler(async (req, res) => {
    const { endpoint, expirationTime = null, keys } = req.body || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        throw new ApiError(400, "Invalid push subscription");
    }

    await User.updateOne(
        { _id: req.user._id },
        {
            $pull: {
                pushSubscriptions: { endpoint },
            },
        }
    );

    await User.updateOne(
        { _id: req.user._id },
        {
            $push: {
                pushSubscriptions: {
                    endpoint,
                    expirationTime,
                    keys: {
                        p256dh: keys.p256dh,
                        auth: keys.auth,
                    },
                },
            },
        }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "Push subscription saved successfully")
    );
});

const unsubscribeFromPush = asyncHandler(async (req, res) => {
    const { endpoint } = req.body || {};

    if (!endpoint) {
        throw new ApiError(400, "Push endpoint is required");
    }

    await User.updateOne(
        { _id: req.user._id },
        {
            $pull: {
                pushSubscriptions: { endpoint },
            },
        }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "Push subscription removed successfully")
    );
});

const getMutedNotificationUsers = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select("mutedNotificationUsers");

    return res.status(200).json(
        new ApiResponse(
            200,
            user?.mutedNotificationUsers || [],
            "Muted notification users fetched successfully"
        )
    );
});


const muteUserNotifications = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (String(userId) === String(req.user._id)) {
        throw new ApiError(
            400,
            "You cannot mute your own notifications"
        );
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet: {
                mutedNotificationUsers: user._id,
            },
        },
        { new: true, select: "mutedNotificationUsers" }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedUser?.mutedNotificationUsers || [],
            "User notifications muted successfully"
        )
    );
});


const unmuteUserNotifications = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $pull: {
                mutedNotificationUsers: userId,
            },
        },
        { new: true, select: "mutedNotificationUsers" }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedUser?.mutedNotificationUsers || [],
            "User notifications unmuted successfully"
        )
    );
});

export {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getPushPublicKey,
    subscribeToPush,
    unsubscribeFromPush,
    getMutedNotificationUsers,
    muteUserNotifications,
    unmuteUserNotifications,
};
