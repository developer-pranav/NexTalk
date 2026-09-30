import api from "./client.js";

export const getVapidPublicKey = async () => {
    const response = await api.get("/notifications/push/public-key");
    return response.data;
};

export const subscribeToPush = async (subscription) => {
    const response = await api.post("/notifications/push/subscribe", subscription);
    return response.data;
};

export const unsubscribeFromPush = async (endpoint) => {
    const response = await api.delete("/notifications/push/subscribe", {
        data: { endpoint },
    });
    return response.data;
};

export const getNotifications = async (params = {}) => {
    const response = await api.get("/notifications", { params });
    return response.data;
};

export const markNotificationRead = async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
};

export const markAllNotificationsRead = async () => {
    const response = await api.patch("/notifications/read-all");
    return response.data;
};

export const getMutedNotificationUsers = async () => {
    const response = await api.get("/notifications/mutes");
    return response.data;
};

export const muteUserNotifications = async (userId) => {
    const response = await api.post(
        `/notifications/mutes/${userId}`
    );

    return response.data;
};

export const unmuteUserNotifications = async (userId) => {
    const response = await api.delete(
        `/notifications/mutes/${userId}`
    );

    return response.data;
};