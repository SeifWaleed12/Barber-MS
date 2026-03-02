import { create } from 'zustand';
import * as discountsApi from '../services/discounts.api';

const useDiscountStore = create((set) => ({
    discounts: [],
    isLoading: false,
    error: null,

    fetchDiscounts: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await discountsApi.getDiscounts();
            set({ discounts: data, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: 'حصل مشكلة، حاول تاني',
            });
        }
    },

    addDiscount: async (discountData) => {
        try {
            const newDiscount = await discountsApi.createDiscount(discountData);
            set((state) => ({ discounts: [...state.discounts, newDiscount] }));
            return true;
        } catch (error) {
            return false;
        }
    },

    updateDiscount: async (id, discountData) => {
        try {
            const updated = await discountsApi.updateDiscount(id, discountData);
            set((state) => ({
                discounts: state.discounts.map((d) => (d.id === id ? updated : d)),
            }));
            return true;
        } catch (error) {
            return false;
        }
    },

    removeDiscount: async (id) => {
        try {
            await discountsApi.deleteDiscount(id);
            set((state) => ({
                discounts: state.discounts.filter((d) => d.id !== id),
            }));
            return true;
        } catch (error) {
            return false;
        }
    },
}));

export default useDiscountStore;
