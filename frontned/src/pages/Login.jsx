import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Button from '../components/ui/Button';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading, error, clearError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        const success = await login(email, password);
        if (success) {
            navigate('/', { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-navy flex items-center justify-center p-4">
            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="bg-surface rounded-3xl border-2 border-border p-8 shadow-2xl card-glow">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <img
                            src="/logo.jpg"
                            alt="Negma Barber Shop"
                            className="w-40 h-40 object-contain rounded-2xl mb-4"
                        />
                        <p className="text-text-secondary text-lg mt-1 font-body">
                            سجل دخولك
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 bg-danger/15 border-2 border-danger/30 rounded-2xl text-danger text-lg text-center animate-fade-in font-heading font-bold">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-lg font-heading font-bold text-text-secondary mb-2"
                            >
                                الإيميل
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="owner@barbershop.com"
                                required
                                className="w-full px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-body"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-lg font-heading font-bold text-text-secondary mb-2"
                            >
                                الباسورد
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-5 py-4 bg-surface-2 border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all pe-14 font-body"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="xl"
                            isLoading={isLoading}
                            className="w-full mt-2"
                        >
                            ادخل
                        </Button>
                    </form>
                </div>

                {/* Bottom text */}
                <p className="text-center text-text-secondary/50 text-sm mt-6 font-body">
                    Negma Barber &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
};

export default Login;
