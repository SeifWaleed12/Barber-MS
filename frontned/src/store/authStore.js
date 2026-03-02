import { create } from 'zustand';
import { loginUser, logoutUser } from '../services/auth.api';

const useAuthStore = create((set) => ({
    token: localStorage.getItem('barberos_token') || null,
    isAuthenticated: !!localStorage.getItem('barberos_token'),
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
            const data = await loginUser(email, password);
            const token = data.access_token;
            localStorage.setItem('barberos_token', token);
            set({ token, isAuthenticated: true, isLoading: false, error: null });
            return true;
        } catch (error) {
            const message = error.response?.data?.detail || 'مفيش نت، اتأكد من الاتصال';
            set({ isLoading: false, error: message });
            return false;
        }
    },

    logout: () => {
        logoutUser();
        set({ token: null, isAuthenticated: false, error: null });
    },

    clearError: () => set({ error: null }),
}));

export default useAuthStore;
