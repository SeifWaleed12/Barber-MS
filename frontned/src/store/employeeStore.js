import { create } from 'zustand';
import * as employeesApi from '../services/employees.api';

const useEmployeeStore = create((set) => ({
    employees: [],
    isLoading: false,
    error: null,

    fetchEmployees: async (search = '') => {
        set({ isLoading: true, error: null });
        try {
            const data = await employeesApi.getEmployees(search);
            set({ employees: data, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: 'حصل مشكلة، حاول تاني',
            });
        }
    },

    addEmployee: async (employeeData) => {
        try {
            const newEmployee = await employeesApi.createEmployee(employeeData);
            set((state) => ({ employees: [...state.employees, newEmployee] }));
            return true;
        } catch (error) {
            return false;
        }
    },

    updateEmployee: async (id, employeeData) => {
        try {
            const updated = await employeesApi.updateEmployee(id, employeeData);
            set((state) => ({
                employees: state.employees.map((e) => (e.id === id ? updated : e)),
            }));
            return true;
        } catch (error) {
            return false;
        }
    },

    removeEmployee: async (id) => {
        try {
            await employeesApi.deleteEmployee(id);
            set((state) => ({
                employees: state.employees.filter((e) => e.id !== id),
            }));
            return true;
        } catch (error) {
            return false;
        }
    },
}));

export default useEmployeeStore;
