'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Target, BookOpen, MessageSquareText, File, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GlobalShortcuts() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K for Search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
            }
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

    // Mock search results for visual layout mapping
    const MOCK_RESULTS = [
        { id: 1, title: 'Operating Systems - Deadlocks', type: 'Study Session', icon: BookOpen, href: '/history' },
        { id: 2, title: 'Database Normalization', type: 'Flashcards', icon: FileText, href: '/arena' },
        { id: 3, title: 'Mid-Term Comprehensive', type: 'Mock Exam', icon: Target, href: '/arena' },
        { id: 4, title: 'CS301_Complete_Syllabus.pdf', type: 'Document', icon: File, href: '/arena' },
    ].filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery);

    return (
        <>
            {/* Global Search Palette (Cmd + K) */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        onClick={() => setIsSearchOpen(false)}
                    ></div>
                    <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center px-4 py-4 border-b border-slate-800">
                            <Search className="w-5 h-5 text-indigo-400 mr-3" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search documents, flashcards, mock exams..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-500 text-lg"
                            />
                            <div className="flex gap-1 pl-3">
                                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-md font-mono tracking-wider">esc</span>
                            </div>
                        </div>
                        <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {MOCK_RESULTS.length > 0 ? (
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-2 mt-1">Results</h3>
                                    {MOCK_RESULTS.map((res) => (
                                        <button
                                            key={res.id}
                                            onClick={() => {
                                                router.push(res.href);
                                                setIsSearchOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between px-3 py-3 hover:bg-slate-800/60 rounded-xl transition-colors group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-colors shadow-inner">
                                                    <res.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-200 tracking-wide">{res.title}</p>
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-0.5">{res.type}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3 opacity-50" />
                                    <p className="text-slate-400 text-sm font-medium">No results found for &quot;{searchQuery}&quot;</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-slate-950/80 px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-bold tracking-wide">
                            <div className="flex gap-4 items-center">
                                <span className="flex items-center gap-1.5"><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">⌘</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">K</kbd> Search</span>
                                <span className="flex items-center gap-1.5"><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">⌘</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">N</kbd> New Plan</span>
                                <span className="flex items-center gap-1.5"><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">⌘</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">/</kbd> AI Tutor</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
