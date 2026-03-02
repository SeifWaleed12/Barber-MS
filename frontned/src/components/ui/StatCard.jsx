import React from 'react';

const StatCard = ({ label, value, icon: Icon, color = 'accent', className = '' }) => {
    const colorMap = {
        accent: 'from-[#E94560]/20 to-[#E94560]/5 border-[#E94560]/30',
        gold: 'from-[#F5A623]/20 to-[#F5A623]/5 border-[#F5A623]/30',
        success: 'from-[#00D4AA]/20 to-[#00D4AA]/5 border-[#00D4AA]/30',
        blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
        purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
    };

    const iconColorMap = {
        accent: 'bg-[#E94560]/20 text-[#E94560]',
        gold: 'bg-[#F5A623]/20 text-[#F5A623]',
        success: 'bg-[#00D4AA]/20 text-[#00D4AA]',
        blue: 'bg-blue-500/20 text-blue-400',
        purple: 'bg-purple-500/20 text-purple-400',
    };

    return (
        <div
            className={`
        bg-gradient-to-br ${colorMap[color]}
        border-2 rounded-2xl p-5 card-glow
        hover:scale-[1.02] transition-transform duration-200
        ${className}
      `}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-text-secondary text-base font-body font-medium">{label}</span>
                {Icon && (
                    <div className={`p-2.5 rounded-xl ${iconColorMap[color]}`}>
                        <Icon size={22} />
                    </div>
                )}
            </div>
            <p className="text-2xl font-heading font-bold text-text-primary">{value}</p>
        </div>
    );
};

export default StatCard;
