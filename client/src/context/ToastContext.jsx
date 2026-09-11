import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Toast from "../components/Toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const timerRef = useRef(null);

    const dismiss = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToast(null);
    }, []);

    const showToast = useCallback((message, options = {}) => {
        if (timerRef.current) clearTimeout(timerRef.current);

        const next = {
            id: Date.now(),
            message,
            title: options.title,
            type: options.type || "info",
            duration: options.duration ?? 4200,
        };

        setToast(next);

        if (next.duration > 0) {
            timerRef.current = setTimeout(() => setToast(null), next.duration);
        }
    }, []);

    useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

    return (
        <ToastContext.Provider value={{ showToast, dismiss }}>
            {children}
            <Toast toast={toast} onClose={dismiss} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
}
