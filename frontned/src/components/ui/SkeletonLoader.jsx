import React from 'react';

const SkeletonLoader = ({ className = '', count = 1, type = 'card' }) => {
    const items = Array.from({ length: count }, (_, i) => i);

    if (type === 'card') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((i) => (
                    <div key={i} className={`bg-surface rounded-2xl p-6 space-y-4 border-2 border-border ${className}`}>
                        <div className="skeleton h-6 w-3/4"></div>
                        <div className="skeleton h-4 w-1/2"></div>
                        <div className="skeleton h-4 w-2/3"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'stat') {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((i) => (
                    <div key={i} className={`bg-surface rounded-2xl p-5 space-y-3 border-2 border-border ${className}`}>
                        <div className="skeleton h-5 w-1/2"></div>
                        <div className="skeleton h-8 w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'list') {
        return (
            <div className="space-y-3">
                {items.map((i) => (
                    <div key={i} className={`bg-surface rounded-2xl p-5 flex items-center gap-4 border-2 border-border ${className}`}>
                        <div className="skeleton h-12 w-12 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                            <div className="skeleton h-5 w-1/3"></div>
                            <div className="skeleton h-4 w-1/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {items.map((i) => (
                <div key={i} className={`skeleton h-5 ${className}`}></div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
