'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { type User as SupabaseUser } from '@supabase/supabase-js';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false });

interface UserMenuProps {
    initialUser: SupabaseUser | null;
}

function UserMenuContent({ initialUser }: UserMenuProps) {
    const supabase = createClient();
    const [openAuth, setOpenAuth] = useState(false);
    const [authMode] = useState<'login' | 'register'>('login');
    const [user, setUser] = useState<SupabaseUser | null>(initialUser);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('login') === 'true' && !user) {
            setOpenAuth(true);
        }
    }, [searchParams, user]);

    useEffect(() => {
        // Fetch current session locally just to ensure synchronization
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) setUser(session.user);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                setOpenAuth(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);



    const handleLogout = async () => {
        setIsMenuOpen(false);
        await supabase.auth.signOut();
        window.location.reload(); // Force full reload to wipe SSR state deeply
    };

    if (user) {
        return (
            <div className="relative">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all hover:scale-105"
                >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-slate-800">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>
                </button>

                {isMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-3 w-56 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/20">
                                <p className="text-sm font-semibold text-slate-100 truncate">{user.email}</p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Authenticated User</p>
                            </div>
                            <div className="p-2 flex flex-col">
                                <Link 
                                    href="/settings"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors group"
                                >
                                    <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                    Profile
                                </Link>
                                <Link 
                                    href="/settings"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors group"
                                >
                                    <Settings className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                                    Settings
                                </Link>
                                <div className="h-px bg-slate-800/80 my-1 mx-2"></div>
                                <button 
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors group"
                                >
                                    <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <>
            <button 
                onClick={() => setOpenAuth(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold tracking-wide rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all w-full sm:w-auto"
            >
                Login / Register
            </button>

            {openAuth && (
                <AuthModal 
                    isOpen={openAuth} 
                    onClose={() => setOpenAuth(false)} 
                    mode={authMode} 
                />
            )}
        </>
    );
}

export default function UserMenu(props: UserMenuProps) {
    return (
        <Suspense fallback={<div className="w-10 h-10 border border-slate-800 rounded-xl animate-pulse bg-slate-800/50" />}>
            <UserMenuContent {...props} />
        </Suspense>
    );
}
