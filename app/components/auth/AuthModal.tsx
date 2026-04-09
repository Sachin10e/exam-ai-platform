'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../ui/Toast';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, mode: initialMode }: AuthModalProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const router = useRouter();
    const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    // Sync mode prop if it changes externally
    useEffect(() => {
        setAuthMode(initialMode);
    }, [initialMode, isOpen]);

    // Trap Focus and Scroll Lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            
            // Auto focus email input
            const timer = setTimeout(() => {
                const emailInput = modalRef.current?.querySelector('input[type="email"]') as HTMLInputElement;
                if (emailInput) emailInput.focus();
            }, 100);

            return () => {
                document.body.style.overflow = '';
                window.removeEventListener('keydown', handleKeyDown);
                clearTimeout(timer);
            };
        }
    }, [isOpen, onClose]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            toast('Supabase environment variables are missing.', 'error');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let response;
            if (authMode === 'register') {
                response = await supabase.auth.signUp({
                    email,
                    password,
                    options: { emailRedirectTo: window.location.origin }
                });
            } else {
                response = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
            }

            if (response.error) {
                throw new Error(response.error.message);
            }

            // On success: update user state, show toast, and close modal
            if (authMode === 'register') {
                toast('Registration successful! Please check your email to verify.', 'success');
            } else {
                toast('Successfully signed in!', 'success');
            }
            
            router.refresh();
            onClose();

        } catch (err: unknown) {
            console.error('[Auth Error]', err);
            const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
            setError(errorMessage);
            toast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 top-0 left-0 w-[100vw] h-[100vh] flex items-center justify-center z-[100]">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                        style={{ background: 'rgba(10, 15, 30, 0.65)', backdropFilter: 'blur(12px)' }}
                        onClick={onClose}
                    />

                    {/* Modal Box */}
                    <motion.div 
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-[90%] sm:max-w-[420px] rounded-[20px] p-[28px] bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-elevated"
                    >
                        {/* Close Button */}
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-6 flex flex-col gap-1.5">
                            <h2 className="text-[28px] font-black text-white tracking-tight">
                                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-sm text-slate-400 font-medium">
                                {authMode === 'login' ? 'Sign in to access your study materials.' : 'Register to secure your preparation data.'}
                            </p>
                        </div>
                        
                        {error && (
                            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-400 text-center animate-in fade-in zoom-in-95">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="flex flex-col gap-[18px]">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 ml-1">Email Address</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                                    placeholder="you@university.edu"
                                />
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 ml-1">Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                                    placeholder="••••••••"
                                />
                            </div>

                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit" 
                                disabled={isLoading}
                                className="w-full h-[44px] mt-2 rounded-[12px] flex items-center justify-center gap-2 text-white text-sm font-bold tracking-wide transition-all disabled:opacity-50"
                                style={{
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                                }}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
                            </motion.button>
                        </form>

                        <div className="mt-5 text-center">
                            <button 
                                onClick={() => { 
                                    setAuthMode(authMode === 'login' ? 'register' : 'login'); 
                                    setError(''); 
                                    setPassword('');
                                }}
                                className="text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors focus:outline-none focus:underline"
                            >
                                {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Sign In"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
