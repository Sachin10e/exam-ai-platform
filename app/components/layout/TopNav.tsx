'use client';

import { Search, Bell, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function TopNav() {
    return (
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-40 print:hidden">
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
                <Link
                    href="/arena"
                    className="hidden sm:flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-semibold px-4 py-2 rounded-full border border-indigo-500/20 transition-all"
                >
                    <Sparkles className="w-4 h-4" />
                    New Plan
                </Link>
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
