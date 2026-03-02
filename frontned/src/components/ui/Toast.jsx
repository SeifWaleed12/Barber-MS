import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] space-y-2 w-[90%] max-w-sm">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center justify-center gap-3 px-5 py-4 rounded-2xl shadow-2xl animate-fade-in
              ${toast.type === 'success' ? 'bg-success' : 'bg-danger'}
            `}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle size={22} className="text-white shrink-0" />
                        ) : (
                            <XCircle size={22} className="text-white shrink-0" />
                        )}
                        <span className="text-white text-lg font-heading font-bold text-center">
                            {toast.message}
                        </span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="mr-1 text-white/70 hover:text-white transition-colors shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
