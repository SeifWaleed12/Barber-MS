import api from './api';

export const loginUser = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
    });
    return response.data;
};

export const logoutUser = () => {
    localStorage.removeItem('barberos_token');
};
