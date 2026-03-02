import { create } from 'zustand';
import * as servicesApi from '../services/services.api';

const useServiceStore = create((set) => ({
    services: [],
    isLoading: false,
    error: null,

    fetchServices: async (search = '') => {
        set({ isLoading: true, error: null });
        try {
            const data = await servicesApi.getServices(search);
            set({ services: data, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: 'حصل مشكلة، حاول تاني',
            });
        }
    },

    addService: async (serviceData) => {
        try {
            const newService = await servicesApi.createService(serviceData);
            set((state) => ({ services: [...state.services, newService] }));
            return true;
        } catch (error) {
            return false;
        }
    },

    updateService: async (id, serviceData) => {
        try {
            const updated = await servicesApi.updateService(id, serviceData);
            set((state) => ({
                services: state.services.map((s) => (s.id === id ? updated : s)),
            }));
            return true;
        } catch (error) {
            return false;
        }
    },

    removeService: async (id) => {
        try {
            await servicesApi.deleteService(id);
            set((state) => ({
                services: state.services.filter((s) => s.id !== id),
            }));
            return true;
        } catch (error) {
            return false;
        }
    },
}));

export default useServiceStore;
