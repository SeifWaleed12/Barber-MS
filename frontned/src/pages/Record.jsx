import React, { useState, useEffect, useMemo } from 'react';
import { User, Check, Minus, Plus, ArrowLeft, RotateCcw, Tag } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { useToast } from '../components/ui/Toast';
import useEmployees from '../hooks/useEmployees';
import useServices from '../hooks/useServices';
import useDiscounts from '../hooks/useDiscounts';
import { createSession } from '../services/sessions.api';
import { formatCurrency } from '../utils/formatCurrency';
import { toApiDate } from '../utils/formatDate';

const Record = () => {
    const { employees, isLoading: empLoading } = useEmployees();
    const { services, isLoading: svcLoading } = useServices();
    const { discounts, isLoading: discLoading } = useDiscounts();
    const { addToast } = useToast();

    const [step, setStep] = useState(1);
    const [selectedBarber, setSelectedBarber] = useState(null);
    const [quantities, setQuantities] = useState({});
    const [selectedDiscount, setSelectedDiscount] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [savedResult, setSavedResult] = useState(null);

    useEffect(() => {
        if (services.length > 0 && Object.keys(quantities).length === 0) {
            const initial = {};
            services.forEach((s) => (initial[s.id] = 0));
            setQuantities(initial);
        }
    }, [services]);

    const updateQuantity = (serviceId, delta) => {
        setQuantities((prev) => ({
            ...prev,
            [serviceId]: Math.max(0, (prev[serviceId] || 0) + delta),
        }));
    };

    const totalRevenue = useMemo(() => {
        return services.reduce((sum, s) => sum + s.price * (quantities[s.id] || 0), 0);
    }, [services, quantities]);

    const discountAmount = useMemo(() => {
        if (!selectedDiscount) return 0;
        if (selectedDiscount.type === 'percentage') {
            return Math.round(totalRevenue * selectedDiscount.value / 100 * 100) / 100;
        }
        return selectedDiscount.value;
    }, [totalRevenue, selectedDiscount]);

    const finalTotal = useMemo(() => {
        return Math.max(0, totalRevenue - discountAmount);
    }, [totalRevenue, discountAmount]);

    const selectedServices = useMemo(() => {
        return services.filter((s) => (quantities[s.id] || 0) > 0);
    }, [services, quantities]);

    const canProceedStep2 = selectedServices.length > 0 && totalRevenue > 0;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const items = selectedServices.map((s) => ({
                service_id: s.id,
                service_name: s.name,
                price: s.price,
                quantity: quantities[s.id],
            }));

            const result = await createSession({
                employee_id: selectedBarber.id,
                date: toApiDate(new Date()),
                items,
                total_revenue: totalRevenue,
                discount_id: selectedDiscount?.id || null,
            });

            setSavedResult(result);
            addToast('✅ اتحفظ', 'success');
            setShowSuccess(true);
        } catch (err) {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
        setIsSaving(false);
    };

    const resetForm = () => {
        setStep(1);
        setSelectedBarber(null);
        setSelectedDiscount(null);
        setSavedResult(null);
        const initial = {};
        services.forEach((s) => (initial[s.id] = 0));
        setQuantities(initial);
        setShowSuccess(false);
    };

    const isLoading = empLoading || svcLoading || discLoading;

    if (isLoading) {
        return <PageWrapper><SkeletonLoader type="card" count={4} /></PageWrapper>;
    }

    // Success screen
    if (showSuccess) {
        return (
            <PageWrapper>
                <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                    <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-6">
                        <Check size={48} className="text-success" />
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-text-primary mb-2">✅ اتحفظ</h2>
                    <p className="text-text-secondary text-xl mb-2">
                        {selectedBarber?.name} — {formatCurrency(savedResult?.final_total || finalTotal)}
                    </p>
                    {savedResult?.discount_amount > 0 && (
                        <p className="text-success text-lg font-heading font-bold mb-6">
                            خصم: {formatCurrency(savedResult.discount_amount)}
                        </p>
                    )}
                    <Button onClick={resetForm} icon={RotateCcw} size="xl">سجل تاني؟</Button>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {[
                    { num: '١', label: 'اختار الحلاق' },
                    { num: '٢', label: 'اختار الخدمات' },
                    { num: '٣', label: 'احفظ' },
                ].map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-heading font-bold transition-all shadow-sm
                ${step >= idx + 1 ? 'btn-gradient text-white scale-110' : 'bg-surface-2 text-text-secondary border border-border/50'}`}>
                                {s.num}
                            </div>
                            <span className={`text-xs font-heading font-bold ${step >= idx + 1 ? 'text-accent' : 'text-text-secondary'}`}>
                                {s.label}
                            </span>
                        </div>
                        {idx < 2 && (
                            <div className={`w-8 h-0.5 mt-[-18px] ${step > idx + 1 ? 'bg-accent' : 'bg-surface-2'} transition-colors`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Pick Barber */}
            {step === 1 && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-heading font-bold text-text-primary mb-4">اختار الحلاق</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {employees.map((emp) => (
                            <button
                                key={emp.id}
                                onClick={() => { setSelectedBarber(emp); setStep(2); }}
                                className={`p-6 rounded-2xl border text-right transition-all duration-200 flex items-center gap-4 min-h-[80px] shadow-sm hover:shadow-md
                  ${selectedBarber?.id === emp.id
                                        ? 'border-accent bg-accent/10 card-glow scale-[1.02]'
                                        : 'border-border/50 bg-surface hover:border-accent/40 hover:bg-surface-2'}`}
                            >
                                <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                                    <User size={28} className="text-accent" />
                                </div>
                                <p className="text-2xl font-heading font-bold text-text-primary">{emp.name}</p>
                            </button>
                        ))}
                    </div>
                    {employees.length === 0 && (
                        <div className="text-center py-20 text-text-secondary text-xl">مفيش حلاقين. ضيف حلاقين الأول.</div>
                    )}
                </div>
            )}

            {/* Step 2: Pick Services */}
            {step === 2 && (
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-heading font-bold text-text-primary">اختار الخدمات</h2>
                        <button onClick={() => setStep(1)}
                            className="flex items-center gap-1 text-text-secondary hover:text-accent transition-colors text-base font-heading font-bold min-h-[44px]">
                            غير الحلاق <ArrowLeft size={18} />
                        </button>
                    </div>

                    <div className="bg-accent/15 border-2 border-accent/20 rounded-xl px-4 py-3 mb-6 inline-flex items-center gap-2">
                        <User size={18} className="text-accent" />
                        <span className="text-accent font-heading font-bold text-lg">{selectedBarber?.name}</span>
                    </div>

                    <div className="space-y-3 mb-6">
                        {services.map((service) => (
                            <div key={service.id}
                                className={`bg-surface rounded-2xl border p-5 flex items-center justify-between transition-all shadow-sm
                  ${quantities[service.id] > 0 ? 'border-accent/40 bg-accent/5 card-glow' : 'border-border/50'}`}>
                                <div>
                                    <p className="text-text-primary font-heading font-bold text-xl">{service.name}</p>
                                    <p className="text-accent-gold text-lg font-heading font-bold">{formatCurrency(service.price)}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => updateQuantity(service.id, -1)}
                                        className="w-16 h-16 rounded-2xl bg-surface-2 hover:bg-border text-text-primary flex items-center justify-center transition-colors active:scale-95 border-2 border-border"
                                        style={{ minWidth: '64px', minHeight: '64px' }}>
                                        <Minus size={26} />
                                    </button>
                                    <span className="w-10 text-center text-2xl font-heading font-bold text-text-primary">
                                        {quantities[service.id] || 0}
                                    </span>
                                    <button onClick={() => updateQuantity(service.id, 1)}
                                        className="w-16 h-16 rounded-2xl bg-accent/20 hover:bg-accent/30 text-accent flex items-center justify-center transition-colors active:scale-95 border-2 border-accent/30"
                                        style={{ minWidth: '64px', minHeight: '64px' }}>
                                        <Plus size={26} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="sticky bottom-[72px] lg:bottom-0 bg-navy/95 backdrop-blur-lg border-t-2 border-border -mx-4 px-4 py-4 lg:-mx-6 lg:px-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-text-secondary text-lg font-heading font-bold">إجمالي الفلوس</span>
                            <span className="text-2xl font-heading font-bold text-accent-gold">{formatCurrency(totalRevenue)}</span>
                        </div>
                        <Button onClick={() => setStep(3)} disabled={!canProceedStep2} variant="primary" size="xl" className="w-full" icon={ArrowLeft}>
                            راجع وحفظ
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Review, Pick Discount & Save */}
            {step === 3 && (
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-heading font-bold text-text-primary">راجع وحفظ</h2>
                        <button onClick={() => setStep(2)}
                            className="flex items-center gap-1 text-text-secondary hover:text-accent transition-colors text-base font-heading font-bold min-h-[44px]">
                            عدّل الخدمات <ArrowLeft size={18} />
                        </button>
                    </div>

                    {/* Barber info */}
                    <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-5 mb-4">
                        <p className="text-text-secondary text-base mb-1 font-body">الحلاق</p>
                        <p className="text-xl font-heading font-bold text-text-primary">{selectedBarber?.name}</p>
                    </div>

                    {/* Services breakdown */}
                    <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-5 mb-4">
                        <p className="text-text-secondary text-base mb-3 font-body">الخدمات</p>
                        <div className="space-y-3">
                            {selectedServices.map((s) => (
                                <div key={s.id} className="flex justify-between text-base">
                                    <span className="text-text-primary font-heading font-bold">{s.name} × {quantities[s.id]}</span>
                                    <span className="text-accent-gold font-heading font-bold">{formatCurrency(s.price * quantities[s.id])}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Discount selection */}
                    {discounts.length > 0 && (
                        <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-5 mb-4">
                            <p className="text-text-secondary text-base mb-3 font-body flex items-center gap-2">
                                <Tag size={18} />
                                اختار خصم (اختياري)
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* No discount option */}
                                <button
                                    onClick={() => setSelectedDiscount(null)}
                                    className={`p-4 rounded-xl border transition-all text-right min-h-[56px] shadow-sm
                    ${!selectedDiscount ? 'border-success bg-success/10 card-glow' : 'border-border/50 hover:border-success/40'}`}
                                >
                                    <p className="font-heading font-bold text-text-primary">بدون خصم</p>
                                </button>
                                {discounts.map((disc) => (
                                    <button
                                        key={disc.id}
                                        onClick={() => setSelectedDiscount(disc)}
                                        className={`p-4 rounded-xl border transition-all text-right min-h-[56px] shadow-sm
                      ${selectedDiscount?.id === disc.id ? 'border-accent bg-accent/10 card-glow' : 'border-border/50 hover:border-accent/40'}`}
                                    >
                                        <p className="font-heading font-bold text-text-primary">{disc.name}</p>
                                        <p className="text-accent-gold text-sm font-bold">
                                            {disc.type === 'percentage' ? `${disc.value}%` : `${formatCurrency(disc.value)} ثابت`}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Financial summary */}
                    <div className="bg-surface-2 rounded-2xl border border-accent/20 p-6 mb-6 space-y-4 shadow-md">
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary text-lg font-heading font-bold">المجموع</span>
                            <span className="text-text-primary text-xl font-heading font-bold">{formatCurrency(totalRevenue)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-success text-lg font-heading font-bold">الخصم ({selectedDiscount?.name})</span>
                                <span className="text-success text-xl font-heading font-bold">-{formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        <div className="border-t-2 border-border pt-4 flex justify-between items-center">
                            <span className="text-accent-gold text-xl font-heading font-bold">الإجمالي ✨</span>
                            <span className="text-accent-gold text-4xl font-heading font-extrabold">{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>

                    <Button onClick={handleSave} isLoading={isSaving} variant="success" size="xl" className="w-full" icon={Check}>
                        احفظ
                    </Button>
                </div>
            )}
        </PageWrapper>
    );
};

export default Record;
