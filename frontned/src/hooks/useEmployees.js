import { useEffect } from 'react';
import useEmployeeStore from '../store/employeeStore';

export const useEmployees = () => {
    const store = useEmployeeStore();

    useEffect(() => {
        if (store.employees.length === 0 && !store.isLoading) {
            store.fetchEmployees();
        }
    }, []);

    return store;
};

export default useEmployees;
