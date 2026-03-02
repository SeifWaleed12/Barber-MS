import { useEffect } from 'react';
import useDiscountStore from '../store/discountStore';

export const useDiscounts = () => {
    const store = useDiscountStore();

    useEffect(() => {
        if (store.discounts.length === 0 && !store.isLoading) {
            store.fetchDiscounts();
        }
    }, []);

    return store;
};

export default useDiscounts;
