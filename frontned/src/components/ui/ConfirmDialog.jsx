import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, isLoading = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in border-2 border-border">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-3 rounded-full bg-danger/20">
                        <AlertTriangle size={32} className="text-danger" />
                    </div>

                    <h3 className="text-xl font-heading font-bold text-text-primary">
                        {title || 'متأكد إنك عايز تمسح؟'}
                    </h3>

                    <p className="text-text-secondary text-lg">
                        {message || 'مش هتقدر ترجع فيها.'}
                    </p>

                    <div className="flex gap-3 w-full mt-2">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            لأ
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-1"
                            onClick={onConfirm}
                            isLoading={isLoading}
                        >
                            آيوه
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
