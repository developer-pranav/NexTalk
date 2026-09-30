import webpush from "web-push";
import { User } from "../models/user.model.js";

let vapidConfigured = false;

function configureWebPush() {
    if (vapidConfigured) return true;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject =
        process.env.VAPID_SUBJECT || "mailto:admin@talkverse.local";

    if (!publicKey || !privateKey) {
        console.warn(
            "Web Push is not configured. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env"
        );
        return false;
    }

    webpush.setVapidDetails(
        subject,
        publicKey,
        privateKey
    );

    vapidConfigured = true;

    return true;
}

export const getVapidPublicKey = () =>
    process.env.VAPID_PUBLIC_KEY || null;


// Send system push notification
export const sendPushNotification = async (
    userId,
    payload,
    senderId = null
) => {
    if (!configureWebPush()) return;

    const user = await User.findById(userId).select(
        "pushSubscriptions mutedNotificationUsers"
    );

    if (!user?.pushSubscriptions?.length) {
        return;
    }

    // Do not send system notification if this sender is muted.
    if (
        senderId &&
        user.mutedNotificationUsers?.some(
            (id) => String(id) === String(senderId)
        )
    ) {
        return;
    }

    const staleEndpoints = [];

    await Promise.all(
        user.pushSubscriptions.map(
            async (subscription) => {
                try {
                    await webpush.sendNotification(
                        subscription.toObject
                            ? subscription.toObject()
                            : subscription,
                        JSON.stringify(payload)
                    );
                } catch (error) {
                    if (
                        error.statusCode === 404 ||
                        error.statusCode === 410
                    ) {
                        staleEndpoints.push(
                            subscription.endpoint
                        );

                        return;
                    }

                    console.error(
                        "Failed to send web push notification:",
                        error.message
                    );
                }
            }
        )
    );

    // Remove expired subscriptions
    if (staleEndpoints.length > 0) {
        await User.updateOne(
            { _id: userId },
            {
                $pull: {
                    pushSubscriptions: {
                        endpoint: {
                            $in: staleEndpoints,
                        },
                    },
                },
            }
        );
    }
};


// Create DB notification + send system notification
export const createAndPushNotification = async ({
    recipient,
    sender = null,
    type,
    title,
    message,
    conversation = null,
    relatedMessage = null,
    relatedConnection = null,
}) => {
    const { Notification } = await import(
        "../models/notification.model.js"
    );

    const notification = await Notification.create({
        recipient,
        sender,
        type,
        title,
        message,
        conversation,
        relatedMessage,
        relatedConnection,
    });

    await sendPushNotification(
        recipient,
        {
            title,
            body: message,

            data: {
                notificationId: String(
                    notification._id
                ),

                type,

                conversationId: conversation
                    ? String(conversation)
                    : null,

                messageId: relatedMessage
                    ? String(relatedMessage)
                    : null,

                url:
                    type === "message" && conversation
                        ? `/chat/${encodeURIComponent(
                            String(conversation)
                        )}`
                        : type === "friend_request"
                            ? "/requests"
                            : type ===
                                "friend_request_accepted" &&
                                conversation
                                ? `/chat/${encodeURIComponent(
                                    String(conversation)
                                )}`
                                : "/",
            },
        },
        sender
    );

    return notification;
};