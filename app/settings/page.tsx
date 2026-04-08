'use client';

import { Settings, User, Bell, Palette, Shield, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { type User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/app/components/ui/Toast';

export default function SettingsPage() {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'privacy' | 'billing'>('profile');
    const { toast } = useToast();

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
            if (data.user) {
                setDisplayName(data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || '');
            }
        });
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                setDisplayName(session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || '');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
            data: { display_name: displayName }
        });
        setIsSaving(false);
        if (error) {
            toast(error.message, 'error');
        } else {
            toast('Profile updated successfully!', 'success');
        }
    };

    const handleThemeChange = (mode: 'light' | 'dark') => {
        if (mode === 'light') {
            document.documentElement.classList.add('light-mode');
            localStorage.setItem('theme_preference', 'light-mode');
        } else {
            document.documentElement.classList.remove('light-mode');
            localStorage.setItem('theme_preference', 'dark');
        }
    };

    const getTabClass = (tabName: string) => {
        return activeTab === tabName 
            ? "w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 font-medium text-sm transition-all text-left"
            : "w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 font-medium text-sm transition-all text-left";
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-12">
            <div className="flex items-center gap-4 border-b border-slate-800/80 pb-6">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <Settings className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 tracking-tight">
                        Settings
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">Manage your account preferences and application settings.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-12">
                <div className="space-y-2">
                    <button onClick={() => setActiveTab('profile')} className={getTabClass('profile')}>
                        <User className="w-5 h-5" /> Account Profile
                    </button>
                    <button onClick={() => setActiveTab('appearance')} className={getTabClass('appearance')}>
                        <Palette className="w-5 h-5" /> Appearance
                    </button>
                    <button onClick={() => setActiveTab('notifications')} className={getTabClass('notifications')}>
                        <Bell className="w-5 h-5" /> Notifications
                    </button>
                    <button onClick={() => setActiveTab('privacy')} className={getTabClass('privacy')}>
                        <Shield className="w-5 h-5" /> Privacy & Security
                    </button>
                    <button onClick={() => setActiveTab('billing')} className={`${getTabClass('billing')} mt-8`}>
                        <CreditCard className="w-5 h-5" /> Billing Data
                    </button>
                </div>

                <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 space-y-8 flex-1 min-h-[400px]">
                    {activeTab === 'profile' && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6">Profile Details</h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Display Name</label>
                                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Loading..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email Address</label>
                                    <input type="email" value={user?.email || 'Loading...'} disabled className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl px-4 py-3 text-slate-400 opacity-60 outline-none" />
                                </div>
                            </div>

                            <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6">Appearance</h3>
                            <div className="space-y-4 bg-slate-950/40 p-6 rounded-2xl border border-slate-800/50">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Theme</label>
                                <div className="flex flex-col gap-4 mt-3">
                                    <label className="flex items-center gap-3 text-slate-300 font-medium cursor-pointer">
                                        <input type="radio" name="theme" className="w-5 h-5 accent-indigo-500" defaultChecked={typeof document !== 'undefined' && !document.documentElement.classList.contains('light-mode')} onClick={() => handleThemeChange('dark')} />
                                        Dark Mode (Default)
                                    </label>
                                    <label className="flex items-center gap-3 text-slate-300 font-medium cursor-pointer">
                                        <input type="radio" name="theme" className="w-5 h-5 accent-indigo-500" defaultChecked={typeof document !== 'undefined' && document.documentElement.classList.contains('light-mode')} onClick={() => handleThemeChange('light')} />
                                        Light Mode
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                            <Bell className="w-16 h-16 mb-6 opacity-20" />
                            <p className="text-lg font-medium">Notification settings coming soon.</p>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                            <Shield className="w-16 h-16 mb-6 opacity-20" />
                            <p className="text-lg font-medium">Privacy & security settings coming soon.</p>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                            <CreditCard className="w-16 h-16 mb-6 opacity-20" />
                            <p className="text-lg font-medium">Billing management coming soon.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
