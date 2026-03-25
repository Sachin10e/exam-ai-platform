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

    return (
        // Parent: overflow-hidden to contain children, no scrolling here
        <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100 print:h-auto print:block print:overflow-visible">

            {/* Sidebar: w-[260px] shrink-0, conditionally mounted (fully removed from DOM when closed) */}
            {isSidebarOpen && (
                <div className="w-[260px] shrink-0 h-full print:hidden">
                    <Sidebar />
                </div>
            )}

            {/* Main column: flex-1 min-w-0, no absolute positioning, no margin hacks */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden print:block print:overflow-visible print:h-auto">
                <TopNav user={user} />
                {/* Scrollable content: overflow-y-auto contained here only */}
                <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar print:overflow-visible print:h-auto print:block">
                    {children}
                </main>
            </div>
        </div>
    );
}
