'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquareText } from 'lucide-react';
import Link from 'next/link';

export default function GlobalShortcuts() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Forward search keys gracefully if needed, but remove Cmd+K capture here
            // Cmd+K is now captured exclusively by TopNav Quick Actions
            // Cmd+N for New Plan
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                router.push('/arena');
                setIsSearchOpen(false);
            }
            // Cmd+/ for AI Tutor
            if ((e.metaKey || e.ctrlKey) && e.key === '/') {
                e.preventDefault();
                router.push('/chat');
                setIsSearchOpen(false);
            }
            // Esc to close search
            if (e.key === 'Escape' && isSearchOpen) {
                setIsSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router, isSearchOpen]);

    // Legacy search array removed

    return (
        <>
            {/* Legacy Search UI removed in favor of TopNav Quick Actions Palette */}

            {/* Floating AI Tutor Button */}
            <Link
                href="/chat"
                className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-2xl shadow-[0_10px_40px_rgba(99,102,241,0.3)] flex items-center justify-center text-white hover:-translate-y-1 active:scale-95 transition-all group print:hidden border border-white/20 hover:shadow-[0_15px_50px_rgba(217,70,239,0.4)] cursor-pointer"
            >
                <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <MessageSquareText className="w-6 h-6 z-10" />

                {/* Tooltip */}
                <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg tracking-wide flex items-center gap-2">
                    AI Tutor <span className="text-slate-500 font-mono bg-slate-950 px-1 rounded">⌘/</span>
                </span>
            </Link>
        </>
    );
}
