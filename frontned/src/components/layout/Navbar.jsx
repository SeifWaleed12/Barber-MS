import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const pageTitles = {
    '/': 'الرئيسية',
    '/record': 'سجل شغل',
    '/haircuts': 'القصات',
    '/employees': 'الحلاقين',
    '/services': 'الخدمات',
    '/discounts': 'الخصومات',
    '/reports': 'التقارير',
    '/costs': 'المصاريف',
    '/settings': 'الإعدادات',
};

// Quick helper to decode JWT payload without external library
const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

const Navbar = ({ onMenuToggle }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, token } = useAuth();
    const title = pageTitles[location.pathname] || 'Negma Barber';

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Get user info from token (fallback to Admin)
    const payload = token && token !== 'demo-token' ? decodeJWT(token) : null;
    const userName = payload?.shop_name || payload?.email?.split('@')[0] || (token === 'demo-token' ? 'Admin' : 'مدير النظام');

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setIsProfileOpen(false);
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <header className="sticky top-0 z-30 bg-navy/80 backdrop-blur-md border-b-2 border-border transition-colors">
            <div className="flex items-center justify-between px-4 py-3 lg:px-6">
                <div className="flex items-center gap-3">
                    <button onClick={onMenuToggle}
                        className="p-2 rounded-xl hover:bg-surface-2 text-text-secondary lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors">
                        <Menu size={24} />
                    </button>
                    <h1 className="text-xl lg:text-2xl font-heading font-bold text-text-primary">{title}</h1>
                </div>

                <div className="flex items-center gap-3 lg:gap-5 relative" ref={dropdownRef}>
                    {/* Profile Toggle */}
                    <div
                        className="hidden sm:flex items-center gap-3 border-r-2 border-border pr-3 lg:pr-5 cursor-pointer group"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent/20">
                            <User size={20} className="text-accent group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-heading font-bold text-text-primary leading-none mb-1 group-hover:text-accent transition-colors capitalize">
                                {userName}
                            </span>
                            <span className="text-xs text-text-secondary font-body leading-none">Sherif</span>
                        </div>
                        <ChevronDown size={16} className={`text-text-secondary group-hover:text-accent transition-all mr-1 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Profile Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute top-[120%] left-0 w-48 bg-surface rounded-2xl border-2 border-border shadow-xl overflow-hidden animate-fade-in card-glow">
                            <div className="p-3 border-b-2 border-border sm:hidden">
                                <span className="block text-sm font-heading font-bold text-text-primary capitalize">{userName}</span>
                                <span className="block text-xs text-text-secondary">Sherif</span>
                            </div>
                            <div className="p-2 space-y-1">
                                <button
                                    onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors font-heading font-bold text-sm"
                                >
                                    <Settings size={18} />
                                    الإعدادات
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-danger hover:bg-danger/10 transition-colors font-heading font-bold text-sm"
                                >
                                    <LogOut size={18} />
                                    تسجيل الخروج
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
