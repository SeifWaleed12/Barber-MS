import api from './api';

export const getDiscounts = async () => {
    const response = await api.get('/discounts');
    return response.data;
};

export const createDiscount = async (data) => {
    const response = await api.post('/discounts', data);
    return response.data;
};

export const updateDiscount = async (id, data) => {
    const response = await api.put(`/discounts/${id}`, data);
    return response.data;
};

export const deleteDiscount = async (id) => {
    const response = await api.delete(`/discounts/${id}`);
    return response.data;
};
