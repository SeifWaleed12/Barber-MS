import React from 'react';

const PageWrapper = ({ children, className = '' }) => {
    return (
        <main className={`p-4 lg:p-6 max-w-7xl mx-auto animate-fade-in pb-bottom-nav lg:pb-6 ${className}`}>
            {children}
        </main>
    );
};

export default PageWrapper;
