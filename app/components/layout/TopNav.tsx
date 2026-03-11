'use client';

import { Search, Bell, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function TopNav() {
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
                {/* Quick Actions Dropdown (Replaces old 'New Plan' button) */}
                <div className="relative group/dropdown hidden sm:block">
                    <button
                        className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-semibold px-4 py-2 rounded-full border border-indigo-500/20 transition-all cursor-pointer"
                    >
                        <Sparkles className="w-4 h-4" />
                        Quick Actions
                    </button>
                    {/* Hover Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-200 transform origin-top-right scale-95 group-hover/dropdown:scale-100 z-50">
                        <div className="p-2 flex flex-col gap-1">
                            <Link href="/arena" className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 font-bold hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors group">
                                <Sparkles className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                                New Study Plan
                            </Link>
                            <Link href="/arena?type=mock" className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 font-bold hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors group">
                                <Search className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                                Take Mock Test
                            </Link>
                            <Link href="/arena?type=flashcard" className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 font-bold hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors group">
                                <Bell className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                                Review Flashcards
                            </Link>
                        </div>
                    </div>
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
