'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BrainCircuit, History, MessageSquare, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useEffect } from 'react';
import { useSidebarStore } from '../../store/sidebar';

const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Study Arena', href: '/arena', icon: BrainCircuit },
    { name: 'History & Archives', href: '/history', icon: History },
    { name: 'AI Chat Assistant', href: '/chat', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { setIsSidebarOpen } = useSidebarStore(); // used by mobile default-collapse effect

    useEffect(() => {
        // On mobile viewports, collapse the sidebar by default
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        // Full-height sidebar — width is controlled by the parent LayoutShell wrapper div
        <div
            id="global-sidebar"
            className="w-full h-full bg-slate-950 border-r border-slate-800/80 flex flex-col print:hidden"
        >
            <div className="p-6 border-b border-slate-800/80">
                <h1 className="font-kalam font-extrabold text-2xl tracking-normal text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400 mb-0">
                    Exam <span className="text-slate-100">Arena</span>
                </h1>
            </div>

            <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                <div className="section-label mb-3 px-3">Navigation</div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={false}
                            onClick={() => {
                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                            }}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                                isActive
                                    ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 pl-[10px]"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                            )}
                        >
                            <item.icon className={clsx("w-5 h-5 shrink-0", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Branding */}
            <div className="p-4 border-t border-slate-800/60">
                <p className="text-[10px] font-medium text-slate-600 tracking-wider uppercase">Exam Arena · v1.0</p>
            </div>
        </div>
    );
}
