import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    getCurrentUser,
    loginUser,
    logoutUser,
    registerUser,
} from "../api/users";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const restoreSession = useCallback(async () => {
        try {
            const response = await getCurrentUser();
            setUser(response?.data || null);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    const register = useCallback(async (data) => {
        const response = await registerUser(data);
        const registeredUser = response?.data || null;

        // The register endpoint sets the access/refresh cookies, so a
        // successful registration is already an authenticated session.
        setUser(registeredUser);

        return registeredUser;
    }, []);

    const login = useCallback(async (credentials) => {
        const response = await loginUser(credentials);
        const loggedInUser = response?.data || null;
        setUser(loggedInUser);
        return loggedInUser;
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutUser();
        } finally {
            setUser(null);
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated: Boolean(user),
            register,
            login,
            logout,
            restoreSession,
        }),
        [user, loading, register, login, logout, restoreSession]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
