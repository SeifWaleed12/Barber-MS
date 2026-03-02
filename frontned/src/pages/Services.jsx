import React, { useState, memo, useCallback } from 'react';
import { Plus, Edit2, Trash2, Check, X, Scissors, Search } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import useServices from '../hooks/useServices';
import { formatCurrency } from '../utils/formatCurrency';

const ServiceRow = memo(({ service, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(service.name);
    const [editPrice, setEditPrice] = useState(service.price);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    const handleSave = async () => {
        setIsSaving(true);
        const success = await onEdit(service.id, { name: editName, price: Number(editPrice) });
        if (success) {
            addToast('✅ اتعدل', 'success');
            setIsEditing(false);
        } else {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
        setIsSaving(false);
    };

    const handleCancel = () => {
        setEditName(service.name);
        setEditPrice(service.price);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="bg-surface rounded-2xl border-2 border-accent/30 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-in">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-4 py-3 bg-surface-2 border-2 border-border rounded-xl text-text-primary text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 font-body" />
                <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                    className="w-32 px-4 py-3 bg-surface-2 border-2 border-border rounded-xl text-text-primary text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 font-body" />
                <div className="flex gap-2">
                    <button onClick={handleSave} disabled={isSaving}
                        className="p-3 rounded-xl bg-success/20 text-success hover:bg-success/30 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center">
                        <Check size={20} />
                    </button>
                    <button onClick={handleCancel}
                        className="p-3 rounded-xl bg-surface-2 text-text-secondary hover:text-text-primary transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center">
                        <X size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-2xl border-2 border-border p-5 flex items-center justify-between hover:border-accent/20 transition-all group">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Scissors size={22} className="text-accent" />
                </div>
                <div>
                    <p className="text-text-primary font-heading font-bold text-lg">{service.name}</p>
                    <p className="text-accent-gold font-heading font-bold text-base">{formatCurrency(service.price)}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsEditing(true)}
                    className="p-3 rounded-xl hover:bg-surface-2 text-text-secondary hover:text-accent transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center">
                    <Edit2 size={20} />
                </button>
                <button onClick={() => onDelete(service)}
                    className="p-3 rounded-xl hover:bg-surface-2 text-text-secondary hover:text-danger transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center">
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
});

ServiceRow.displayName = 'ServiceRow';

const Services = () => {
    const { services, isLoading, fetchServices, addService, updateService, removeService } = useServices();
    const { addToast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, service: null });
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = useCallback((e) => {
        const q = e.target.value;
        setSearchQuery(q);
        fetchServices(q);
    }, [fetchServices]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        const success = await addService({ name: newName, price: Number(newPrice) });
        if (success) {
            addToast('✅ اتضاف', 'success');
            setNewName('');
            setNewPrice('');
            setShowAddForm(false);
        } else {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
        setIsAdding(false);
    };

    const handleDelete = async () => {
        if (!deleteDialog.service) return;
        setIsDeleting(true);
        const success = await removeService(deleteDialog.service.id);
        if (success) {
            addToast('✅ اتمسح', 'success');
        } else {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
        setIsDeleting(false);
        setDeleteDialog({ open: false, service: null });
    };

    return (
        <PageWrapper>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-heading font-bold text-text-primary">الخدمات والأسعار</h2>
                    <p className="text-text-secondary text-base">{services.length} خدمة</p>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)} icon={Plus} size="md">ضيف خدمة</Button>
            </div>

            {/* Search bar */}
            <div className="relative mb-6">
                <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="ابحث عن خدمة..."
                    className="w-full ps-5 pe-12 py-4 bg-surface border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-body"
                />
            </div>

            {showAddForm && (
                <form onSubmit={handleAdd}
                    className="bg-surface rounded-2xl border-2 border-accent/30 p-5 mb-4 flex flex-col sm:flex-row gap-3 animate-fade-in">
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="اسم الخدمة" required
                        className="flex-1 px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 font-body" />
                    <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="السعر (ج.م)" required
                        className="w-full sm:w-36 px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 font-body" />
                    <div className="flex gap-2">
                        <Button type="submit" variant="success" isLoading={isAdding} icon={Check}>احفظ</Button>
                        <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)} icon={X}>لأ</Button>
                    </div>
                </form>
            )}

            {isLoading ? (
                <SkeletonLoader type="list" count={5} />
            ) : services.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Scissors size={36} className="text-text-secondary" />
                    </div>
                    <p className="text-text-secondary mb-4 text-lg">
                        {searchQuery ? 'مفيش نتايج' : 'مفيش خدمات لحد دلوقتي'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={() => setShowAddForm(true)} icon={Plus}>ضيف أول خدمة</Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {services.map((service) => (
                        <ServiceRow key={service.id} service={service} onEdit={updateService}
                            onDelete={(s) => setDeleteDialog({ open: true, service: s })} />
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, service: null })}
                onConfirm={handleDelete}
                title="متأكد إنك عايز تمسح؟"
                message={`هتمسح "${deleteDialog.service?.name}"؟`}
                isLoading={isDeleting}
            />
        </PageWrapper>
    );
};

export default Services;
