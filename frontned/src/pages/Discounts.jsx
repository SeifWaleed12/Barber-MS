import React, { useState, memo } from 'react';
import { Plus, Edit2, Trash2, Tag, Percent, DollarSign } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import Drawer from '../components/ui/Drawer';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import useDiscounts from '../hooks/useDiscounts';

const DiscountCard = memo(({ discount, onEdit, onDelete }) => (
    <div className="bg-surface rounded-2xl border-2 border-border p-5 hover:border-accent/30 transition-all duration-200 card-glow">
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Tag size={22} className="text-accent" />
                </div>
                <div>
                    <h3 className="text-xl font-heading font-bold text-text-primary">{discount.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        {discount.type === 'percentage' ? (
                            <span className="text-accent-gold font-heading font-bold text-base flex items-center gap-1">
                                <Percent size={14} /> {discount.value}%
                            </span>
                        ) : (
                            <span className="text-accent-gold font-heading font-bold text-base flex items-center gap-1">
                                <DollarSign size={14} /> {discount.value} ج.م
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => onEdit(discount)}
                    className="p-3 rounded-xl hover:bg-surface-2 text-text-secondary hover:text-accent transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center">
                    <Edit2 size={20} />
                </button>
                <button onClick={() => onDelete(discount)}
                    className="p-3 rounded-xl hover:bg-surface-2 text-text-secondary hover:text-danger transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center">
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    </div>
));

DiscountCard.displayName = 'DiscountCard';

const Discounts = () => {
    const { discounts, isLoading, addDiscount, updateDiscount, removeDiscount } = useDiscounts();
    const { addToast } = useToast();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, discount: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState('percentage');
    const [formValue, setFormValue] = useState('');

    const openAddDrawer = () => {
        setEditingDiscount(null);
        setFormName('');
        setFormType('percentage');
        setFormValue('');
        setDrawerOpen(true);
    };

    const openEditDrawer = (disc) => {
        setEditingDiscount(disc);
        setFormName(disc.name);
        setFormType(disc.type);
        setFormValue(disc.value);
        setDrawerOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const data = {
            name: formName,
            type: formType,
            value: Number(formValue),
        };

        try {
            if (editingDiscount) {
                const success = await updateDiscount(editingDiscount.id, data);
                if (success) {
                    addToast('✅ اتعدل بنجاح', 'success');
                    setDrawerOpen(false);
                } else {
                    addToast('حصل مشكلة، حاول تاني', 'error');
                }
            } else {
                const success = await addDiscount(data);
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
        if (!deleteDialog.discount) return;
        setIsDeleting(true);
        const success = await removeDiscount(deleteDialog.discount.id);
        if (success) {
            addToast('✅ اتمسح', 'success');
        } else {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
        setIsDeleting(false);
        setDeleteDialog({ open: false, discount: null });
    };

    return (
        <PageWrapper>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-heading font-bold text-text-primary">الخصومات</h2>
                    <p className="text-text-secondary text-base">{discounts.length} خصم</p>
                </div>
            </div>

            {isLoading ? (
                <SkeletonLoader type="card" count={4} />
            ) : discounts.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tag size={36} className="text-text-secondary" />
                    </div>
                    <p className="text-text-secondary mb-4 text-lg">مفيش خصومات لحد دلوقتي</p>
                    <Button onClick={openAddDrawer} icon={Plus}>ضيف أول خصم</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {discounts.map((disc) => (
                        <DiscountCard
                            key={disc.id}
                            discount={disc}
                            onEdit={openEditDrawer}
                            onDelete={(d) => setDeleteDialog({ open: true, discount: d })}
                        />
                    ))}
                </div>
            )}

            {/* FAB */}
            <button onClick={openAddDrawer}
                className="fixed bottom-24 lg:bottom-6 left-6 w-16 h-16 btn-gradient rounded-full shadow-lg shadow-accent/30 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-30">
                <Plus size={30} />
            </button>

            {/* Drawer */}
            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}
                title={editingDiscount ? 'عدّل خصم' : 'ضيف خصم'}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-lg font-heading font-bold text-text-secondary mb-2">اسم الخصم</label>
                        <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                            placeholder="مثلاً: خصم طلاب" required
                            className="w-full px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-body" />
                    </div>

                    <div>
                        <label className="block text-lg font-heading font-bold text-text-secondary mb-2">نوع الخصم</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setFormType('percentage')}
                                className={`p-4 rounded-xl border-2 text-center font-heading font-bold transition-all min-h-[56px]
                  ${formType === 'percentage' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-accent/30'}`}>
                                <Percent size={20} className="mx-auto mb-1" />
                                نسبة %
                            </button>
                            <button type="button" onClick={() => setFormType('fixed')}
                                className={`p-4 rounded-xl border-2 text-center font-heading font-bold transition-all min-h-[56px]
                  ${formType === 'fixed' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-accent/30'}`}>
                                <DollarSign size={20} className="mx-auto mb-1" />
                                مبلغ ثابت
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-lg font-heading font-bold text-text-secondary mb-2">
                            القيمة {formType === 'percentage' ? '(%)' : '(ج.م)'}
                        </label>
                        <input type="number" value={formValue} onChange={(e) => setFormValue(e.target.value)}
                            placeholder={formType === 'percentage' ? 'مثلاً 10' : 'مثلاً 20'} required min="0.01" step="0.01"
                            className="w-full px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-body" />
                    </div>

                    <Button type="submit" variant="primary" size="xl" isLoading={isSubmitting} className="w-full"
                        icon={editingDiscount ? Edit2 : Plus}>
                        {editingDiscount ? 'عدّل' : 'ضيف خصم'}
                    </Button>
                </form>
            </Drawer>

            <ConfirmDialog isOpen={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, discount: null })}
                onConfirm={handleDelete} title="متأكد إنك عايز تمسح؟"
                message={`هتمسح "${deleteDialog.discount?.name}"؟`} isLoading={isDeleting} />
        </PageWrapper>
    );
};

export default Discounts;
