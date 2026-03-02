import React, { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Check, X } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import MonthPicker from '../components/ui/MonthPicker';
import Button from '../components/ui/Button';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { getCosts, createCost, deleteCost } from '../services/costs.api';
import { formatCurrency } from '../utils/formatCurrency';
import { toMonthString } from '../utils/formatDate';

const Costs = () => {
    const [month, setMonth] = useState(toMonthString(new Date()));
    const [costs, setCosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newType, setNewType] = useState('variable');
    const [isAdding, setIsAdding] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, cost: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const { addToast } = useToast();

    const fetchCosts = async () => {
        setIsLoading(true);
        try {
            const data = await getCosts(month);
            setCosts(data || []);
        } catch (err) {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCosts();
    }, [month]);

    const totalFixed = costs.filter(c => c.type === 'fixed').reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalVariable = costs.filter(c => c.type === 'variable').reduce((sum, c) => sum + (c.amount || 0), 0);
    const total = totalFixed + totalVariable;

    const handleAdd = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            const costMonth = newType === 'fixed' ? undefined : month;
            const newCost = await createCost({ month: costMonth, type: newType, label: newLabel, amount: Number(newAmount) });
            setCosts((prev) => [...prev, newCost]);
            addToast('✅ اتضاف', 'success');
            setNewLabel('');
            setNewAmount('');
            setShowAddForm(false);
        } catch {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
        setIsAdding(false);
    };

    const handleDelete = async () => {
        if (!deleteDialog.cost) return;
        setIsDeleting(true);
        try {
            await deleteCost(deleteDialog.cost.id);
            setCosts((prev) => prev.filter((c) => c.id !== deleteDialog.cost.id));
            addToast('✅ اتمسح', 'success');
        } catch {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
        setIsDeleting(false);
        setDeleteDialog({ open: false, cost: null });
    };

    return (
        <PageWrapper>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <MonthPicker value={month} onChange={setMonth} />
                <Button onClick={() => setShowAddForm(!showAddForm)} icon={Plus} size="md">
                    ضيف مصروف
                </Button>
            </div>

            {/* Add form */}
            {showAddForm && (
                <form
                    onSubmit={handleAdd}
                    className="bg-surface rounded-2xl border-2 border-accent/30 p-5 mb-4 flex flex-col sm:flex-row gap-3 animate-fade-in"
                >
                    <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="اسم المصروف"
                        required
                        className="flex-1 px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 font-body"
                    />
                    <input
                        type="number"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        placeholder="المبلغ (ج.م)"
                        required
                        className="w-full sm:w-32 px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 font-body"
                    />
                    <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        className="w-full sm:w-32 px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 font-body"
                    >
                        <option value="variable">متغير</option>
                        <option value="fixed">ثابت</option>
                    </select>
                    <div className="flex gap-2">
                        <Button type="submit" variant="success" isLoading={isAdding} icon={Check}>
                            احفظ
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)} icon={X}>
                            لأ
                        </Button>
                    </div>
                </form>
            )}

            {/* Costs list */}
            {isLoading ? (
                <SkeletonLoader type="list" count={5} />
            ) : costs.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign size={36} className="text-text-secondary" />
                    </div>
                    <p className="text-text-secondary mb-4 text-lg">مفيش مصاريف الشهر ده</p>
                    <Button onClick={() => setShowAddForm(true)} icon={Plus}>
                        ضيف أول مصروف
                    </Button>
                </div>
            ) : (
                <div className="space-y-3 mb-4">
                    {costs.map((cost) => (
                        <div
                            key={cost.id}
                            className="bg-surface rounded-2xl border border-border/50 shadow-sm p-5 flex items-center justify-between group hover:border-accent/30 transition-all hover:shadow-md"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-text-primary font-heading font-bold text-lg">{cost.label}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-md font-heading font-bold ${cost.type === 'fixed' ? 'bg-primary/20 text-primary' : 'bg-surface-2 text-text-secondary'}`}>
                                        {cost.type === 'fixed' ? 'ثابت' : 'متغير'}
                                    </span>
                                </div>
                                <p className="text-danger font-heading font-bold text-base">
                                    -{formatCurrency(cost.amount)}
                                </p>
                            </div>
                            <button
                                onClick={() => setDeleteDialog({ open: true, cost })}
                                className="p-3 rounded-xl hover:bg-danger/20 text-text-secondary hover:text-danger transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Totals */}
            {costs.length > 0 && (
                <div className="space-y-4">
                    <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-5 flex items-center justify-between">
                        <span className="text-text-secondary font-heading font-bold text-lg">مصاريف ثابتة</span>
                        <span className="text-xl font-heading font-bold text-danger">
                            -{formatCurrency(totalFixed)}
                        </span>
                    </div>
                    <div className="bg-surface rounded-2xl border-2 border-border p-5 flex items-center justify-between">
                        <span className="text-text-secondary font-heading font-bold text-lg">مصاريف متغيرة</span>
                        <span className="text-xl font-heading font-bold text-danger">
                            -{formatCurrency(totalVariable)}
                        </span>
                    </div>
                    <div className="bg-surface-2 rounded-2xl border border-danger/20 p-6 flex items-center justify-between shadow-md">
                        <span className="text-text-primary font-heading font-bold text-lg">إجمالي المصاريف</span>
                        <span className="text-2xl font-heading font-bold text-danger">
                            -{formatCurrency(total)}
                        </span>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, cost: null })}
                onConfirm={handleDelete}
                title="متأكد إنك عايز تمسح؟"
                message={`هتمسح "${deleteDialog.cost?.label}"؟`}
                isLoading={isDeleting}
            />
        </PageWrapper>
    );
};

export default Costs;
