import api from './api';

export const getServices = async (search = '') => {
    const response = await api.get('/services', {
        params: { search, skip: 0, limit: 100 },
    });
    return response.data;
};

export const createService = async (data) => {
    const response = await api.post('/services', data);
    return response.data;
};

export const updateService = async (id, data) => {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
};

export const deleteService = async (id) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
};
