'use client';

import { Search, Bell, Sparkles, Clock, BookOpen, Target, FileText } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import PomodoroTimer from '../study/PomodoroTimer';

const QUICK_ACTIONS = [
    { id: 'start', label: 'Start Study Session', icon: BookOpen, href: '/arena' },
    { id: 'plan', label: 'Generate Study Plan', icon: Sparkles, href: '/arena' },
    { id: 'mock', label: 'Take Mock Test', icon: Target, href: '/arena?type=mock' },
    { id: 'flashcard', label: 'Review Flashcards', icon: Bell, href: '/arena?type=flashcard' },
    { id: 'upload', label: 'Upload Syllabus', icon: FileText, href: '/arena' }
];

export default function TopNav() {
    const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsQuickActionsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsQuickActionsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <header id="global-topnav" className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-40 print:hidden transition-transform duration-300">
            <div className="flex items-center flex-1 max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search documents, plans..."
                        className="w-full bg-slate-900/50 border border-slate-800/80 text-slate-200 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 shadow-inner"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Quick Actions Command Palette Dropdown */}
                <div className="relative hidden sm:block">
                    <button
                        onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                        className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-semibold px-4 py-2 rounded-full border border-indigo-500/20 transition-all cursor-pointer"
                    >
                        <Sparkles className="w-4 h-4" />
                        Quick Actions
                        <span className="ml-1 text-[10px] font-mono bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300 tracking-widest hidden xl:inline-block border border-indigo-500/20">⌘K</span>
                    </button>

                    {isQuickActionsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsQuickActionsOpen(false)}></div>
                            <div className="absolute right-0 top-full mt-3 w-80 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                                    <Search className="w-4 h-4 text-indigo-400 mr-2 shrink-0" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Type an action..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-500 text-sm"
                                    />
                                    <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded-md font-mono tracking-wider ml-2 border border-slate-700">esc</span>
                                </div>
                                <div className="p-2 max-h-[60vh] overflow-y-auto">
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-2 mt-1 mb-1">Actions</h3>
                                    {QUICK_ACTIONS.filter(action => action.label.toLowerCase().includes(searchQuery.toLowerCase())).map((action) => (
                                        <Link
                                            key={action.id}
                                            href={action.href}
                                            onClick={() => setIsQuickActionsOpen(false)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800/80 rounded-xl transition-colors group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center border border-slate-700 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-colors">
                                                    <action.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-200 tracking-wide">{action.label}</p>
                                            </div>
                                        </Link>
                                    ))}
                                    {QUICK_ACTIONS.filter(action => action.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                        <div className="text-center py-6">
                                            <p className="text-slate-500 text-xs font-medium">No actions found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative">
                    <button 
                        onClick={() => setIsTimerOpen(!isTimerOpen)}
                        className="p-2 text-slate-400 hover:text-slate-200 relative transition-colors"
                    >
                        <Clock className="w-5 h-5" />
                    </button>
                    {isTimerOpen && (
                        <div className="absolute right-0 top-full mt-2 z-50">
                            <PomodoroTimer />
                        </div>
                    )}
                </div>

                <Link href="/settings" className="p-2 text-slate-400 hover:text-slate-200 relative transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
                </Link>
                <Link href="/settings">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 border-2 border-slate-800 cursor-pointer shadow-md hover:scale-105 transition-transform"></div>
                </Link>
            </div>
        </header>
    );
}
