'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BrainCircuit, History, MessageSquare, Settings } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Study Arena', href: '/arena', icon: BrainCircuit },
    { name: 'History & Archives', href: '/history', icon: History },
    { name: 'AI Chat Assistant', href: '/chat', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div id="global-sidebar" className="w-64 border-r border-slate-800/80 bg-slate-950/50 backdrop-blur-xl h-screen flex flex-col print:hidden sticky top-0 shrink-0 transition-transform duration-300">
            <div className="p-6 border-b border-slate-800/80">
                <h1 className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
                    Exam <span className="text-white">Arena</span>
                </h1>
            </div>

            <div className="flex-1 p-4 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">Navigation</div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                                isActive
                                    ? "bg-indigo-500/10 text-indigo-400"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                            )}
                        >
                            <item.icon className={clsx("w-5 h-5", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

        </div>
    );
}
