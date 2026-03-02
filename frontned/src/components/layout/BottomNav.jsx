import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, BarChart3 } from 'lucide-react';

const tabs = [
    { path: '/', icon: LayoutDashboard, label: 'الرئيسية' },
    { path: '/record', icon: ClipboardList, label: 'سجل شغل' },
    { path: '/employees', icon: Users, label: 'الحلاقين' },
    { path: '/reports', icon: BarChart3, label: 'التقارير' },
];

const BottomNav = () => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg border-t-2 border-border lg:hidden">
            <div className="flex items-center justify-around py-2 px-2">
                {tabs.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-[70px]
              ${isActive ? 'bottom-nav-active' : 'text-text-secondary'}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={24} className={isActive ? 'text-accent' : ''} />
                                <span className={`text-xs font-heading font-bold ${isActive ? 'text-accent' : ''}`}>
                                    {label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
