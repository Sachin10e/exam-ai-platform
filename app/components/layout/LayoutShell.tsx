'use client';

import { useState, useEffect } from 'react';
import { useSidebarStore } from '../../store/sidebar';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

interface LayoutShellProps {
    children: React.ReactNode;
}

export default function LayoutShell({ children }: LayoutShellProps) {
    const isSidebarOpen = useSidebarStore(state => state.isOpen);
    const closeSidebar = useSidebarStore(state => state.close);
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        // Parent: overflow-hidden to contain children, no scrolling here
        <div className="flex h-screen w-full overflow-x-hidden md:overflow-hidden bg-slate-950 text-slate-100 print:h-auto print:block print:overflow-visible min-w-0 max-w-full">

            {/* Desktop Behavior: Only render when explicitly open, fixed 260px, no DOM footprint when closed */}
            {mounted && !isMobile && isSidebarOpen && (
                <div id="global-sidebar-wrapper" className="w-[260px] shrink-0 h-full print:hidden">
                    <Sidebar />
                </div>
            )}

            {/* SSR Placeholder for Desktop */}
            {!mounted && isSidebarOpen && (
                <div className="hidden md:block w-[260px] shrink-0 h-full print:hidden">
                    <Sidebar />
                </div>
            )}

            {/* Mobile Behavior: Overlay, fixed inset, dark backdrop */}
            {mounted && isMobile && isSidebarOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-shrink-0 w-[260px] max-w-[85vw] bg-[#0B0F1A] overflow-x-hidden min-w-0">
                        <Sidebar />
                    </div>

                    <div 
                        className="flex-1 bg-black/60 backdrop-blur-sm"
                        onClick={() => closeSidebar()}
                    />
                </div>
            )}

            {/* Main content: Always flex-1 min-w-0 full width */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden print:block print:overflow-visible print:h-auto">
                <TopNav />
                <main className="flex-1 min-w-0 overflow-y-auto px-4 md:px-6 lg:px-8 custom-scrollbar print:overflow-visible print:h-auto print:block">
                    {children}
                </main>
            </div>
        </div>
    );
}
