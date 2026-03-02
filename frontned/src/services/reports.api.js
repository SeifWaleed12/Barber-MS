import api from './api';

export const getDashboard = async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
};

export const getMonthlyReport = async (month) => {
    const response = await api.get('/reports/monthly', {
        params: { month },
    });
    return response.data;
};
