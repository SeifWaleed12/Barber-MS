import React from 'react';
import { Loader2 } from 'lucide-react';

const sizes = {
    sm: 'px-4 py-2.5 text-base rounded-xl min-h-[48px]',
    md: 'px-5 py-3 text-base rounded-xl min-h-[56px]',
    lg: 'px-6 py-3.5 text-lg rounded-xl min-h-[56px]',
    xl: 'px-8 py-4 text-xl rounded-2xl min-h-[60px]',
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    icon: Icon,
    ...props
}) => {
    const variantClasses = {
        primary: 'btn-gradient',
        success: 'bg-success hover:brightness-110 text-white font-bold',
        danger: 'bg-danger hover:brightness-110 text-white font-bold',
        secondary: 'bg-surface-2 hover:bg-border text-text-primary font-semibold',
        ghost: 'bg-transparent hover:bg-surface-2 text-text-secondary font-medium',
    };

    return (
        <button
            disabled={disabled || isLoading}
            className={`
        inline-flex items-center justify-center gap-2.5
        font-heading font-bold
        transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.97]
        ${variantClasses[variant]} ${sizes[size]} ${className}
      `}
            {...props}
        >
            {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
            ) : Icon ? (
                <Icon size={20} />
            ) : null}
            {children}
        </button>
    );
};

export default Button;
