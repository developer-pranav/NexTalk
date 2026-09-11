import api from "./client.js";

export const sendFriendRequest = async (userId) => {
    const response = await api.post(`/connections/request/${userId}`);
    return response.data;
};

export const getFriendRequests = async () => {
    const response = await api.get("/connections/requests");
    return response.data;
};

export const getMyConnections = async () => {
    const response = await api.get("/connections");
    return response.data;
};

export const cancelFriendRequest = async (requestId) => {
    const response = await api.delete(`/connections/request/${requestId}/cancel`);
    return response.data;
};

export const acceptFriendRequest = async (requestId) => {
    const response = await api.patch(`/connections/request/${requestId}/accept`);
    return response.data;
};

export const rejectFriendRequest = async (requestId) => {
    const response = await api.patch(`/connections/request/${requestId}/reject`);
    return response.data;
};

export const blockUser = async (userId) => {
    const response = await api.post(`/connections/block/${userId}`);
    return response.data;
};

export const unblockUser = async (userId) => {
    const response = await api.delete(`/connections/block/${userId}`);
    return response.data;
};
