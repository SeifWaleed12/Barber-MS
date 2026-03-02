import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { formatMonth } from '../../utils/formatDate';

const MonthPicker = ({ value, onChange }) => {
    const handlePrev = () => {
        const [year, month] = value.split('-').map(Number);
        const d = new Date(year, month - 2, 1);
        const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        onChange(newMonth);
    };

    const handleNext = () => {
        const [year, month] = value.split('-').map(Number);
        const d = new Date(year, month, 1);
        const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        onChange(newMonth);
    };

    return (
        <div className="flex items-center gap-4 bg-surface rounded-2xl px-5 py-3 w-fit border-2 border-border">
            {/* In RTL, "next" arrow (right chevron) goes to previous */}
            <button
                onClick={handleNext}
                className="p-2 rounded-xl hover:bg-surface-2 transition-colors text-text-secondary hover:text-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
                <ChevronRight size={22} />
            </button>
            <span className="text-text-primary font-heading font-bold min-w-[160px] text-center text-lg">
                {formatMonth(value)}
            </span>
            <button
                onClick={handlePrev}
                className="p-2 rounded-xl hover:bg-surface-2 transition-colors text-text-secondary hover:text-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
                <ChevronLeft size={22} />
            </button>
        </div>
    );
};

export default MonthPicker;
