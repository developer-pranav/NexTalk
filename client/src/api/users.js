import api from "./client.js";


export const registerUser = async (data) => {
    const response = await api.post("/users/register", data);
    return response.data;
};

export const loginUser = async (data) => {
    const response = await api.post("/users/login", data);
    return response.data;
};

export const logoutUser = async () => {
    const response = await api.post("/users/logout");
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get("/users/me");
    return response.data;
};

export const searchUsers = async (search) => {
    const response = await api.get("/users", {
        params: { search },
    });
    return response.data;
};

export const getUser = async (username) => {
    const response = await api.get(`/users/${username}`);
    return response.data;
};