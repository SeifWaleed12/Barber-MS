import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Scissors,
    ClipboardList,
    BarChart3,
    DollarSign,
    Settings,
    Tag,
    Table2,
    ChevronRight,
    X,
} from 'lucide-react';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'الرئيسية' },
    { path: '/record', icon: ClipboardList, label: 'سجل شغل' },
    { path: '/haircuts', icon: Table2, label: 'القصات' },
    { path: '/employees', icon: Users, label: 'الحلاقين' },
    { path: '/services', icon: Scissors, label: 'الخدمات' },
    { path: '/discounts', icon: Tag, label: 'الخصومات' },
    { path: '/reports', icon: BarChart3, label: 'التقارير' },
    { path: '/costs', icon: DollarSign, label: 'المصاريف' },
    { path: '/settings', icon: Settings, label: 'الإعدادات' },
];

const Sidebar = ({ isOpen, onToggle }) => {
    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onToggle} />
            )}

            <aside className={`
        fixed top-0 right-0 h-full bg-surface z-50
        border-l-2 border-border transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'w-64 translate-x-0' : 'w-64 translate-x-full lg:translate-x-0 lg:w-64'}
      `}>
                <div className="flex items-center justify-between p-5 border-b-2 border-border">
                    <div className="flex items-center gap-3">
                        <img src="/logo.jpg" alt="Negma Barber" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                        <span className={`text-xl brand-name text-text-primary whitespace-nowrap transition-opacity duration-200
              ${isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
                            Negma Barber
                        </span>
                    </div>
                    <button onClick={onToggle}
                        className="p-1.5 rounded-xl hover:bg-surface-2 text-text-secondary lg:hidden">
                        <X size={22} />
                    </button>
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <NavLink key={path} to={path}
                            onClick={() => { if (window.innerWidth < 1024) onToggle(); }}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-200 group min-h-[48px]
                ${isActive
                                    ? 'bg-accent/15 text-accent border-2 border-accent/30'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2 border-2 border-transparent'}`
                            }>
                            <Icon size={22} className="shrink-0" />
                            <span className={`font-heading font-bold text-base whitespace-nowrap transition-opacity duration-200
                ${isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
                                {label}
                            </span>
                        </NavLink>
                    ))}
                </nav>


            </aside>
        </>
    );
};

export default Sidebar;
