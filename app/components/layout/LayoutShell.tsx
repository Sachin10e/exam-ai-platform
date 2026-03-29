'use client';

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

    return (
        // Parent: overflow-hidden to contain children, no scrolling here
        <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100 print:h-auto print:block print:overflow-visible">

            {/* Mobile sidebar overlay backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar: fixed overlay on mobile, sticky inline on desktop */}
            {isSidebarOpen && (
                <>
                    {/* Mobile: fixed overlay */}
                    <div className="fixed inset-y-0 left-0 w-[260px] max-w-[85vw] z-50 md:hidden print:hidden">
                        <Sidebar />
                    </div>
                    {/* Desktop: inline flex item */}
                    <div id="global-sidebar-wrapper" className="hidden md:block w-[260px] shrink-0 h-full print:hidden">
                        <Sidebar />
                    </div>
                </>
            )}

            {/* Main column: flex-1 min-w-0, no absolute positioning, no margin hacks */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden print:block print:overflow-visible print:h-auto">
                <TopNav user={user} />
                {/* Scrollable content: overflow-y-auto for all pages */}
                <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar print:overflow-visible print:h-auto print:block">
                    {children}
                </main>
            </div>
        </div>
    );
}
