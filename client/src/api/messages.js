import api from "./client.js";


export const getMessages = async (conversationId) => {
    const response = await api.get(`/messages/${conversationId}`);
    return response.data;
};

export const sendMessage = async (conversationId, data) => {
    const response = await api.post(
        `/messages/${conversationId}`,
        data
    );

    return response.data;
};

export const sendMediaMessage = async (conversationId, formData) => {
    const response = await api.post(
        `/messages/${conversationId}/media`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};

export const deleteMessage = async (messageId) => {
    const response = await api.delete(
        `/messages/${messageId}`
    );

    return response.data;
};