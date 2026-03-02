import React, { useState } from 'react';
import { LogOut, Store, Mail, Scissors, Lock, Eye, EyeOff, Check } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import useAuth from '../hooks/useAuth';
import { changePassword } from '../services/auth.api';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [isChanging, setIsChanging] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPass.length < 8) {
            addToast('الباسورد لازم يكون ٨ حروف على الأقل', 'error');
            return;
        }
        if (newPass !== confirmPass) {
            addToast('الباسوردين مش زي بعض', 'error');
            return;
        }

        setIsChanging(true);
        try {
            await changePassword(currentPass, newPass);
            addToast('✅ اتغير الباسورد بنجاح', 'success');
            setCurrentPass('');
            setNewPass('');
            setConfirmPass('');
        } catch (err) {
            const msg = err.response?.status === 400
                ? 'الباسورد القديم غلط'
                : 'حصل مشكلة، حاول تاني';
            addToast(msg, 'error');
        }
        setIsChanging(false);
    };

    return (
        <PageWrapper>
            <div className="max-w-lg mx-auto space-y-6">
                {/* Shop info */}
                <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-6 card-glow">
                    <div className="flex items-center gap-4 mb-6">
                        <img src="/logo.jpg" alt="Negma Barber" className="w-16 h-16 rounded-2xl object-cover" />
                        <div>
                            <h2 className="text-2xl brand-name text-text-primary">Negma Barber</h2>
                            <p className="text-text-secondary text-base font-body">إدارة الصالون</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-surface-2 rounded-xl border border-border/50">
                            <Store size={20} className="text-text-secondary" />
                            <div>
                                <p className="text-text-secondary text-sm font-body">اسم المحل</p>
                                <p className="text-text-primary font-heading font-bold text-lg">Negma Barber</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-surface-2 rounded-xl border border-border/50">
                            <Mail size={20} className="text-text-secondary" />
                            <div>
                                <p className="text-text-secondary text-sm font-body">الإيميل</p>
                                <p className="text-text-primary font-heading font-bold text-lg">owner@barbershop.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-6">
                    <h3 className="font-heading font-bold text-text-primary mb-4 text-lg flex items-center gap-2">
                        <Lock size={20} className="text-accent" />
                        تغيير كلمة السر
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-base font-heading font-bold text-text-secondary mb-2">الباسورد الحالي</label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPass}
                                    onChange={(e) => setCurrentPass(e.target.value)}
                                    required
                                    className="w-full px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all pe-14 font-body"
                                />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1">
                                    {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-base font-heading font-bold text-text-secondary mb-2">الباسورد الجديد (٨ حروف على الأقل)</label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    required
                                    minLength={8}
                                    className="w-full px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all pe-14 font-body"
                                />
                                <button type="button" onClick={() => setShowNew(!showNew)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1">
                                    {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-base font-heading font-bold text-text-secondary mb-2">أكد الباسورد الجديد</label>
                            <input
                                type="password"
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                required
                                className="w-full px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-body"
                            />
                        </div>

                        <Button type="submit" variant="primary" size="lg" isLoading={isChanging} className="w-full" icon={Check}>
                            غير الباسورد
                        </Button>
                    </form>
                </div>

                {/* About */}
                <div className="bg-surface rounded-2xl border border-border/50 shadow-sm p-6">
                    <h3 className="font-heading font-bold text-text-primary mb-3 text-lg">عن التطبيق</h3>
                    <div className="space-y-2 text-base text-text-secondary font-body">
                        <p>الإصدار: 1.0.0</p>
                        <p>React + TailwindCSS</p>
                    </div>
                </div>

                {/* Logout */}
                <Button onClick={handleLogout} variant="danger" size="xl" className="w-full" icon={LogOut}>اخرج</Button>
            </div>
        </PageWrapper>
    );
};

export default Settings;
