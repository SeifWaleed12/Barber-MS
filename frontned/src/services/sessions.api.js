import api from './api';

export const createSession = async (data) => {
    const response = await api.post('/sessions', data);
    return response.data;
};

export const getSessions = async (start, end) => {
    const response = await api.get('/sessions', {
        params: { start, end, skip: 0, limit: 100 },
    });
    return response.data;
};

export const getHaircuts = async (employeeId = '', date = '', month = '') => {
    const response = await api.get('/sessions/haircuts', {
        params: { employee_id: employeeId || undefined, date: date || undefined, month: month || undefined, skip: 0, limit: 100 },
    });
    return response.data;
};

export const deleteSession = async (id) => {
    const response = await api.delete(`/sessions/${id}`);
    return response.data;
};
