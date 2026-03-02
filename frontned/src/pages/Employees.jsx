import React, { useState, memo, useCallback } from 'react';
import { Plus, Edit2, Trash2, DollarSign, User, Search } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import Drawer from '../components/ui/Drawer';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import useEmployees from '../hooks/useEmployees';
import { formatCurrency } from '../utils/formatCurrency';

const EmployeeCard = memo(({ employee, onEdit, onDelete }) => (
    <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-5 hover:border-accent/30 transition-all duration-200 group hover:shadow-md card-glow">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center">
                    <User size={26} className="text-accent" />
                </div>
                <div>
                    <h3 className="text-xl font-heading font-bold text-text-primary">
                        {employee.name}
                    </h3>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-accent-gold/15 px-4 py-2 rounded-xl">
                <DollarSign size={16} className="text-accent-gold" />
                <span className="text-accent-gold font-heading font-bold text-base">
                    المرتب: {formatCurrency(employee.salary)}
                </span>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onEdit(employee)}
                    className="p-3 rounded-xl hover:bg-surface-2 text-text-secondary hover:text-accent transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                >
                    <Edit2 size={20} />
                </button>
                <button
                    onClick={() => onDelete(employee)}
                    className="p-3 rounded-xl hover:bg-surface-2 text-text-secondary hover:text-danger transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    </div>
));

EmployeeCard.displayName = 'EmployeeCard';

const Employees = () => {
    const { employees, isLoading, fetchEmployees, addEmployee, updateEmployee, removeEmployee } =
        useEmployees();
    const { addToast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, employee: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formName, setFormName] = useState('');
    const [formSalary, setFormSalary] = useState('');

    const handleSearch = useCallback((e) => {
        const q = e.target.value;
        setSearchQuery(q);
        fetchEmployees(q);
    }, [fetchEmployees]);

    const openAddDrawer = () => {
        setEditingEmployee(null);
        setFormName('');
        setFormSalary('');
        setDrawerOpen(true);
    };

    const openEditDrawer = (employee) => {
        setEditingEmployee(employee);
        setFormName(employee.name);
        setFormSalary(employee.salary || '');
        setDrawerOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const data = {
            name: formName,
            salary: Number(formSalary),
        };

        try {
            if (editingEmployee) {
                const success = await updateEmployee(editingEmployee.id, data);
                if (success) {
                    addToast('✅ اتعدل بنجاح', 'success');
                    setDrawerOpen(false);
                } else {
                    addToast('حصل مشكلة، حاول تاني', 'error');
                }
            } else {
                const success = await addEmployee(data);
                if (success) {
                    addToast('✅ اتضاف بنجاح', 'success');
                    setDrawerOpen(false);
                } else {
                    addToast('حصل مشكلة، حاول تاني', 'error');
                }
            }
        } catch {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
        setIsSubmitting(false);
    };

    const handleDelete = async () => {
        if (!deleteDialog.employee) return;
        setIsDeleting(true);
        const success = await removeEmployee(deleteDialog.employee.id);
        if (success) {
            addToast('✅ اتمسح', 'success');
        } else {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
        setIsDeleting(false);
        setDeleteDialog({ open: false, employee: null });
    };

    return (
        <PageWrapper>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-heading font-bold text-text-primary">الحلاقين</h2>
                    <p className="text-text-secondary text-base">{employees.length} حلاق مسجل</p>
                </div>
            </div>

            {/* Search bar */}
            <div className="relative mb-6">
                <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="ابحث عن حلاق..."
                    className="w-full ps-5 pe-12 py-4 bg-surface border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-body"
                />
            </div>

            {/* Grid */}
            {isLoading ? (
                <SkeletonLoader type="card" count={6} />
            ) : employees.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={36} className="text-text-secondary" />
                    </div>
                    <p className="text-text-secondary mb-4 text-lg">
                        {searchQuery ? 'مفيش نتايج' : 'مفيش حلاقين لحد دلوقتي'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={openAddDrawer} icon={Plus}>ضيف أول حلاق</Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees.map((emp) => (
                        <EmployeeCard
                            key={emp.id}
                            employee={emp}
                            onEdit={openEditDrawer}
                            onDelete={(e) => setDeleteDialog({ open: true, employee: e })}
                        />
                    ))}
                </div>
            )}

            {/* FAB */}
            <button
                onClick={openAddDrawer}
                className="fixed bottom-24 lg:bottom-6 left-6 w-16 h-16 btn-gradient rounded-full shadow-lg shadow-accent/30 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-30"
            >
                <Plus size={30} />
            </button>

            {/* Drawer */}
            <Drawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={editingEmployee ? 'عدّل حلاق' : 'ضيف حلاق'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-lg font-heading font-bold text-text-secondary mb-2">الاسم</label>
                        <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="اسم الحلاق"
                            required
                            className="w-full px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-body"
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-heading font-bold text-text-secondary mb-2">
                            المرتب (كل أسبوعين) (ج.م)
                        </label>
                        <input
                            type="number"
                            value={formSalary}
                            onChange={(e) => setFormSalary(e.target.value)}
                            placeholder="مثلاً 5000"
                            required
                            min="1"
                            className="w-full px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-body"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="xl"
                        isLoading={isSubmitting}
                        className="w-full"
                        icon={editingEmployee ? Edit2 : Plus}
                    >
                        {editingEmployee ? 'عدّل' : 'ضيف حلاق'}
                    </Button>
                </form>
            </Drawer>

            <ConfirmDialog
                isOpen={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, employee: null })}
                onConfirm={handleDelete}
                title="متأكد إنك عايز تمسح؟"
                message={`هتمسح ${deleteDialog.employee?.name}. مش هتقدر ترجع فيها.`}
                isLoading={isDeleting}
            />
        </PageWrapper>
    );
};

export default Employees;
