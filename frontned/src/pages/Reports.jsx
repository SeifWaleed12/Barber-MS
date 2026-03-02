import React, { useState, useEffect, useMemo } from 'react';
import { Printer, ChevronDown, ChevronUp, Trash2, DollarSign, Users, Receipt, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import PageWrapper from '../components/layout/PageWrapper';
import MonthPicker from '../components/ui/MonthPicker';
import StatCard from '../components/ui/StatCard';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { getMonthlyReport } from '../services/reports.api';
import { getSessions, deleteSession } from '../services/sessions.api';
import { formatCurrency } from '../utils/formatCurrency';
import { toMonthString, formatDate } from '../utils/formatDate';

const Reports = () => {
    const [month, setMonth] = useState(toMonthString(new Date()));
    const [report, setReport] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionsExpanded, setSessionsExpanded] = useState(false);
    const { addToast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [year, mon] = month.split('-');
            const lastDay = new Date(year, mon, 0).getDate();
            const [reportData, sessionsData] = await Promise.all([
                getMonthlyReport(month),
                getSessions(`${month}-01`, `${month}-${lastDay}`),
            ]);
            setReport(reportData);
            setSessions(sessionsData || []);
        } catch (err) {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
        setIsLoading(false);
    };

    useEffect(() => { fetchData(); }, [month]);

    const barberChartData = useMemo(() => {
        if (!report?.barber_breakdown) return [];
        return report.barber_breakdown.map((b) => ({
            name: b.name,
            revenue: b.revenue || 0,
        }));
    }, [report]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-surface border border-border/50 rounded-xl px-4 py-3 shadow-lg">
                    <p className="text-text-primary text-base font-heading font-bold">{label}</p>
                    <p className="text-accent-gold text-base font-bold">{formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    const handleDeleteSession = async (id) => {
        try {
            await deleteSession(id);
            setSessions((prev) => prev.filter((s) => s.id !== id));
            addToast('✅ اتمسح', 'success');
            fetchData();
        } catch {
            addToast('حصل مشكلة، حاول تاني', 'error');
        }
    };

    return (
        <PageWrapper>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 no-print">
                <MonthPicker value={month} onChange={setMonth} />
                <Button onClick={() => window.print()} icon={Printer} variant="secondary" size="md">اطبع التقرير</Button>
            </div>

            {isLoading ? (
                <SkeletonLoader type="stat" count={4} />
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard label="الإيرادات" value={formatCurrency(report?.revenue || 0)} icon={DollarSign} color="gold" />
                        <StatCard label="المرتبات" value={formatCurrency(report?.total_salaries || 0)} icon={Users} color="blue" />
                        <StatCard label="المصاريف" value={formatCurrency(report?.costs || 0)} icon={Receipt} color="purple" />
                        <StatCard label="صافي الربح" value={formatCurrency(report?.net_profit || 0)} icon={TrendingUp} color="success" />
                    </div>

                    {barberChartData.length > 0 && (
                        <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-6 mb-6 card-glow">
                            <h3 className="text-xl font-heading font-bold text-text-primary mb-6">فلوس كل حلاق</h3>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barberChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#3A3A4E" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A0A0B0', fontSize: 14 }} reversed />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A0A0B0', fontSize: 14 }} orientation="right" />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(233, 69, 96, 0.08)' }} />
                                        <Bar dataKey="revenue" fill="#E94560" radius={[6, 6, 0, 0]} maxBarSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <div className="bg-surface rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                        <button onClick={() => setSessionsExpanded(!sessionsExpanded)}
                            className="w-full flex items-center justify-between p-5 hover:bg-surface-2 transition-colors min-h-[56px]">
                            <h3 className="text-xl font-heading font-bold text-text-primary">الجلسات ({sessions.length})</h3>
                            {sessionsExpanded ? <ChevronUp size={22} className="text-text-secondary" /> : <ChevronDown size={22} className="text-text-secondary" />}
                        </button>
                        {sessionsExpanded && (
                            <div className="border-t border-border/50 divide-y divide-border/50">
                                {sessions.length === 0 ? (
                                    <div className="p-5 text-center text-text-secondary text-lg">مفيش جلسات الشهر ده</div>
                                ) : (
                                    sessions.map((session) => (
                                        <div key={session.id} className="p-5 flex items-center justify-between hover:bg-surface-2/50 transition-colors">
                                            <div>
                                                <p className="text-text-primary font-heading font-bold">{session.employee_name || formatDate(session.date)}</p>
                                                <div className="flex gap-3 text-base">
                                                    <span className="text-accent-gold font-bold">{formatCurrency(session.final_total || session.total_revenue)}</span>
                                                    {session.discount_amount > 0 && (
                                                        <span className="text-success font-bold">خصم: {formatCurrency(session.discount_amount)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteSession(session.id)}
                                                className="p-3 rounded-xl hover:bg-danger/20 text-text-secondary hover:text-danger transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </PageWrapper>
    );
};

export default Reports;
