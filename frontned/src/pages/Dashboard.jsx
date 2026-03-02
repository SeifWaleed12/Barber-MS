import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, BarChart3, Crown, ClipboardList, PieChart, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../components/ui/StatCard';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import PageWrapper from '../components/layout/PageWrapper';
import { getDashboard } from '../services/reports.api';
import { formatCurrency } from '../utils/formatCurrency';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getDashboard();
                setData(result);
            } catch (err) {
                setError('حصل مشكلة، حاول تاني');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-surface border-2 border-border rounded-xl px-4 py-3 shadow-lg">
                    <p className="text-text-primary text-base font-heading font-bold">{label}</p>
                    <p className="text-accent-gold text-base font-bold">{formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    // Month comparison
    const monthDiff = data ? (data.month_revenue - (data.last_month_revenue || 0)) : 0;
    const monthUp = monthDiff >= 0;

    return (
        <PageWrapper>
            {isLoading ? (
                <SkeletonLoader type="stat" count={4} />
            ) : error ? (
                <div className="bg-danger/15 border-2 border-danger/30 rounded-2xl p-5 text-danger text-center mb-6 text-lg font-heading font-bold">
                    {error}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        label="فلوس النهارده"
                        value={formatCurrency(data?.today_revenue || 0)}
                        icon={DollarSign}
                        color="gold"
                    />

                    <StatCard
                        label="الشهر ده"
                        value={formatCurrency(data?.month_revenue || 0)}
                        icon={BarChart3}
                        color="blue"
                    />
                    <StatCard
                        label="أحسن حلاق"
                        value={data?.top_barber?.name || '—'}
                        icon={Crown}
                        color="purple"
                    />
                </div>
            )}

            {/* Month comparison */}
            {data && data.last_month_revenue != null && (
                <div className={`flex items-center gap-2 mb-6 px-4 py-3 rounded-xl border-2 w-fit
          ${monthUp ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'}`}>
                    {monthUp ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                    <span className="font-heading font-bold text-base">
                        {monthUp ? 'أعلى' : 'أقل'} من الشهر اللي فات بـ {formatCurrency(Math.abs(monthDiff))}
                    </span>
                </div>
            )}

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-xl font-heading font-bold text-text-primary mb-4">اختار ايه تعمل</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button onClick={() => navigate('/record')}
                        className="group bg-surface hover:bg-accent/10 border-2 border-border hover:border-accent/30 rounded-2xl p-6 flex flex-col items-center gap-3 transition-all duration-200 card-glow min-h-[120px]">
                        <div className="p-3 rounded-xl bg-accent/15 group-hover:bg-accent/25 transition-colors">
                            <ClipboardList size={32} className="text-accent" />
                        </div>
                        <span className="text-text-primary font-heading font-bold text-lg">سجل شغل النهارده</span>
                    </button>
                    <button onClick={() => navigate('/reports')}
                        className="group bg-surface hover:bg-accent-gold/10 border-2 border-border hover:border-accent-gold/30 rounded-2xl p-6 flex flex-col items-center gap-3 transition-all duration-200 min-h-[120px] card-glow">
                        <div className="p-3 rounded-xl bg-accent-gold/15 group-hover:bg-accent-gold/25 transition-colors">
                            <PieChart size={32} className="text-accent-gold" />
                        </div>
                        <span className="text-text-primary font-heading font-bold text-lg">شوف التقارير</span>
                    </button>
                    <button onClick={() => navigate('/employees')}
                        className="group bg-surface hover:bg-success/10 border-2 border-border hover:border-success/30 rounded-2xl p-6 flex flex-col items-center gap-3 transition-all duration-200 min-h-[120px] card-glow">
                        <div className="p-3 rounded-xl bg-success/15 group-hover:bg-success/25 transition-colors">
                            <Users size={32} className="text-success" />
                        </div>
                        <span className="text-text-primary font-heading font-bold text-lg">إدارة الحلاقين</span>
                    </button>
                </div>
            </div>
        </PageWrapper>
    );
};

export default Dashboard;
