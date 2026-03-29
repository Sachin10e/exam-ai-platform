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
            {/* Floating AI Tutor Button: REMOVED per user request — keyboard shortcut Cmd+/ still works */}
        </>
    );
}
