import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Drawer = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-start">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer Panel — slides from right in RTL (which is start) */}
            <div className="relative w-full max-w-md bg-surface h-full animate-slide-in shadow-2xl flex flex-col border-l-2 border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b-2 border-border">
                    <h2 className="text-xl font-heading font-bold text-text-primary">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-surface-2 transition-colors text-text-secondary hover:text-text-primary"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Drawer;
