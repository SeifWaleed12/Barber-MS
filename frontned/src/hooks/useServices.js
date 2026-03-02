import { useEffect } from 'react';
import useServiceStore from '../store/serviceStore';

export const useServices = () => {
    const store = useServiceStore();

    useEffect(() => {
        if (store.services.length === 0 && !store.isLoading) {
            store.fetchServices();
        }
    }, []);

    return store;
};

export default useServices;
