import api from "./client.js";


export const createDirectConversation = async (userId) => {
    const response = await api.post(`/conversations/direct/${userId}`);
    return response.data;
};

export const getMyConversations = async () => {
    const response = await api.get("/conversations");
    return response.data;
};

export const getConversation = async (conversationId) => {
    const response = await api.get(`/conversations/${conversationId}`);
    return response.data;
};