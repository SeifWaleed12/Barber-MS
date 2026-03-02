import React, { useState, useEffect } from 'react';
import { Scissors, User, Filter } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { useToast } from '../components/ui/Toast';
import useEmployees from '../hooks/useEmployees';
import { getHaircuts } from '../services/sessions.api';
import { formatCurrency } from '../utils/formatCurrency';

const Haircuts = () => {
    const { employees } = useEmployees();
    const { addToast } = useToast();

    const [haircuts, setHaircuts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterBarber, setFilterBarber] = useState('');
    const [viewMode, setViewMode] = useState('day'); // 'day' | 'month'

    // Get today's date in YYYY-MM-DD
    const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);

    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

    const fetchHaircuts = async (employeeId = filterBarber, mode = viewMode, d = selectedDate, m = selectedMonth) => {
        setIsLoading(true);
        try {
            const dateStr = mode === 'day' ? d : '';
            const monthStr = mode === 'month' ? m : '';
            const data = await getHaircuts(employeeId, dateStr, monthStr);
            setHaircuts(data || []);
        } catch (err) {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchHaircuts(filterBarber, viewMode, selectedDate, selectedMonth);
    }, [filterBarber, viewMode, selectedDate, selectedMonth]);

    const barberTotals = haircuts.reduce((acc, h) => {
        const total = acc[h.barber_name] || 0;
        return { ...acc, [h.barber_name]: total + (h.final_total || 0) };
    }, {});

    const grandTotal = haircuts.reduce((sum, h) => sum + (h.final_total || 0), 0);

    return (
        <PageWrapper>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-heading font-bold text-text-primary">سجل القصات</h2>

                {/* Barber filter */}
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-text-secondary" />
                    <select
                        value={filterBarber}
                        onChange={(e) => setFilterBarber(e.target.value)}
                        className="px-4 py-3 bg-surface border-2 border-border rounded-xl text-text-primary text-base font-heading font-bold focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all min-w-[150px] min-h-[48px]"
                    >
                        <option value="">كل الحلاقين</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabs & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 relative z-10">
                <div className="flex bg-surface-2 p-2 rounded-2xl md:w-auto w-full border border-border/50">
                    <button
                        onClick={() => setViewMode('day')}
                        className={`flex-1 md:px-8 py-3 text-base font-heading font-bold rounded-xl transition-all ${viewMode === 'day' ? 'bg-surface text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        عرض باليوم
                    </button>
                    <button
                        onClick={() => setViewMode('month')}
                        className={`flex-1 md:px-8 py-3 text-base font-heading font-bold rounded-xl transition-all ${viewMode === 'month' ? 'bg-surface text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        عرض بالشهر
                    </button>
                </div>

                {viewMode === 'day' ? (
                    <div className="flex-1">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-3 bg-surface border-2 border-border rounded-xl text-text-primary text-base font-heading font-bold focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        />
                    </div>
                ) : (
                    <div className="flex-1">
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-4 py-3 bg-surface border-2 border-border rounded-xl text-text-primary text-base font-heading font-bold focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        />
                    </div>
                )}
            </div>

            {/* Stats */}
            {!isLoading && haircuts.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-accent/10 rounded-2xl border border-accent/30 shadow-sm p-5 flex flex-col justify-center items-center text-center transition-transform hover:scale-105 duration-200">
                        <span className="text-accent text-base font-heading font-bold mb-1">
                            {viewMode === 'day' ? 'إجمالي اليوم' : 'إجمالي الشهر'}
                        </span>
                        <span className="text-accent font-heading font-bold text-2xl">{formatCurrency(grandTotal)}</span>
                    </div>
                    {Object.entries(barberTotals).map(([name, total]) => (
                        <div key={name} className="bg-surface rounded-2xl border border-border/50 shadow-sm p-5 flex flex-col justify-center items-center text-center transition-transform hover:scale-105 duration-200">
                            <span className="text-text-secondary text-base font-heading font-medium mb-1">{name}</span>
                            <span className="text-accent-gold font-heading font-bold text-xl">{formatCurrency(total)}</span>
                        </div>
                    ))}
                </div>
            )}

            {isLoading ? (
                <SkeletonLoader type="list" count={6} />
            ) : haircuts.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Scissors size={36} className="text-text-secondary" />
                    </div>
                    <p className="text-text-secondary text-lg">مفيش قصات لحد دلوقتي</p>
                </div>
            ) : (
                <>
                    {/* Mobile cards */}
                    <div className="lg:hidden space-y-3">
                        {haircuts.map((h) => (
                            <div key={h.id} className="bg-surface rounded-2xl border-2 border-border p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent font-heading font-bold text-sm">
                                            {h.number}
                                        </span>
                                        <span className="text-text-secondary text-base font-body">{h.date}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-text-primary font-heading font-bold">
                                        <User size={14} />
                                        {h.barber_name}
                                    </div>
                                </div>
                                <div className="space-y-1 mb-3">
                                    {(h.services || []).map((s, i) => (
                                        <p key={i} className="text-text-secondary text-sm font-body">
                                            {s.service_name} × {s.quantity} — {formatCurrency(s.price * s.quantity)}
                                        </p>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t-2 border-border pt-3">
                                    <div>
                                        <span className="text-text-secondary text-sm">المجموع: </span>
                                        <span className="text-text-primary font-heading font-bold">{formatCurrency(h.total_revenue)}</span>
                                    </div>
                                    {h.discount_amount > 0 && (
                                        <span className="text-success font-heading font-bold text-sm">خصم: {formatCurrency(h.discount_amount)}</span>
                                    )}
                                    <div>
                                        <span className="text-accent-gold font-heading font-bold text-lg">{formatCurrency(h.final_total)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden lg:block bg-surface rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="border-b border-border bg-surface-2/30">
                                        <th className="p-5 font-heading font-bold text-text-secondary text-base">#</th>
                                        <th className="p-5 font-heading font-bold text-text-secondary text-base">التاريخ</th>
                                        <th className="p-5 font-heading font-bold text-text-secondary text-base">الحلاق</th>
                                        <th className="p-5 font-heading font-bold text-text-secondary text-base">الخدمات</th>
                                        <th className="p-5 font-heading font-bold text-text-secondary text-base">المجموع</th>
                                        <th className="p-5 font-heading font-bold text-text-secondary text-base">الخصم</th>
                                        <th className="p-5 font-heading font-bold text-text-secondary text-base">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {haircuts.map((h) => (
                                        <tr key={h.id} className="hover:bg-surface-2/50 transition-colors group cursor-default">
                                            <td className="p-5 font-heading font-bold text-accent group-hover:scale-110 transition-transform origin-right">{h.number}</td>
                                            <td className="p-5 text-text-primary font-body">{h.date}</td>
                                            <td className="p-5 text-text-primary font-heading font-bold">{h.barber_name}</td>
                                            <td className="p-5 text-text-secondary text-sm font-body">
                                                {(h.services || []).map((s) => `${s.service_name}×${s.quantity}`).join('، ')}
                                            </td>
                                            <td className="p-5 text-text-primary font-heading font-bold">{formatCurrency(h.total_revenue)}</td>
                                            <td className="p-5 text-success font-heading font-bold">
                                                {h.discount_amount > 0 ? formatCurrency(h.discount_amount) : '—'}
                                            </td>
                                            <td className="p-5 text-accent-gold font-heading font-bold text-lg">{formatCurrency(h.final_total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </PageWrapper>
    );
};

export default Haircuts;
