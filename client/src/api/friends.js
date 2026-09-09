import api from "./client.js";


export const sendFriendRequest = async (userId) => {
    const response = await api.post(`/connection/request/${userId}`);
    return response.data;
};

export const getFriendRequests = async () => {
    const response = await api.get("/connection/requests");
    return response.data;
};

export const acceptFriendRequest = async (requestId) => {
    const response = await api.patch(
        `/connection/request/${requestId}/accept`
    );
    return response.data;
};

export const rejectFriendRequest = async (requestId) => {
    const response = await api.patch(
        `/connection/request/${requestId}/reject`
    );
    return response.data;
};

export const blockUser = async (userId) => {
    const response = await api.post(`/connection/block/${userId}`);
    return response.data;
};

export const unblockUser = async (userId) => {
    const response = await api.delete(`/connection/block/${userId}`);
    return response.data;
};