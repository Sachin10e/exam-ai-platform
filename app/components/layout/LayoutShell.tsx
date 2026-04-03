'use client';

import { useState, useEffect } from 'react';
import { type User as SupabaseUser } from '@supabase/supabase-js';
import { useSidebarStore } from '../../store/sidebar';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

interface LayoutShellProps {
    user: SupabaseUser | null;
    children: React.ReactNode;
}

export default function LayoutShell({ user, children }: LayoutShellProps) {
    const isSidebarOpen = useSidebarStore(state => state.isSidebarOpen);
    const setIsSidebarOpen = useSidebarStore(state => state.setIsSidebarOpen);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        // Parent: overflow-hidden to contain children, no scrolling here
        <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100 print:h-auto print:block print:overflow-visible">

            {!isMobile && isSidebarOpen && (
                <div id="global-sidebar-wrapper" className="w-[260px] shrink-0 h-full print:hidden">
                    <Sidebar />
                </div>
            )}

            {isMobile && isSidebarOpen && (
                <div className="fixed inset-0 z-50 flex">
                    
                    <div className="w-[260px] bg-[#0B0F1A]">
                        <Sidebar />
                    </div>

                    <div 
                        className="flex-1 bg-black/50"
                        onClick={() => setIsSidebarOpen(false)}
                    />

                </div>
            )}

            {/* Main column: flex-1 min-w-0, no absolute positioning, no margin hacks */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden print:block print:overflow-visible print:h-auto">
                <TopNav user={user} />
                {/* Scrollable content: overflow-y-auto for all pages */}
                <main className="flex-1 min-w-0 overflow-y-auto px-4 md:px-6 lg:px-8 custom-scrollbar print:overflow-visible print:h-auto print:block">
                    {children}
                </main>
            </div>
        </div>
    );
}
