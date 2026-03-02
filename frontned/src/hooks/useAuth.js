import useAuthStore from '../store/authStore';

export const useAuth = () => {
    const { token, isAuthenticated, isLoading, error, login, logout, clearError } = useAuthStore();
    return { token, isAuthenticated, isLoading, error, login, logout, clearError };
};

export default useAuth;
