import api from './api';

export const getCosts = async (month) => {
    const response = await api.get('/costs', {
        params: { month },
    });
    return response.data;
};

export const createCost = async (data) => {
    const response = await api.post('/costs', data);
    return response.data;
};

export const deleteCost = async (id) => {
    const response = await api.delete(`/costs/${id}`);
    return response.data;
};
