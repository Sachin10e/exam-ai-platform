'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { History, BookOpen, Clock, Search, Tag, TrendingUp } from 'lucide-react';
import { getSessions, StudySessionMeta } from '../actions/sessions';

const getTagsForSession = (session: StudySessionMeta) => {
    let examType: string = session.metadata?.examType === 'Mid' && session.metadata?.midType 
        ? String(session.metadata.midType)
        : session.metadata?.examType ? String(session.metadata.examType) : 'General';

    let subject = session.title || 'General';
    if (subject.includes(':')) {
        subject = subject.split(':')[0].trim();
    } else if (subject.includes('(')) {
        subject = subject.split('(')[0].trim();
    }

    const urgency = session.metadata?.urgency;
    let difficulty = 'Standard';
    let difficultyColor = 'text-amber-400 bg-amber-400/10 border-amber-400/20';

    if (urgency === 'Cram') {
        difficulty = 'Quick Prep';
        difficultyColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    } else if (urgency === 'Deep') {
        difficulty = 'Deep Study';
        difficultyColor = 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    }

    return {
        subject,
        examType,
        difficulty,
        difficultyColor
    };
};

export default function HistoryPage() {
    const [sessions, setSessions] = useState<StudySessionMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterSubject, setFilterSubject] = useState('All');
    const [filterExamType, setFilterExamType] = useState('All');
    const [sortBy, setSortBy] = useState('Newest');

    // Extract unique virtual metadata for dropdowns
    const availableSubjects = useMemo(() => {
        const subs = new Set(sessions.map(s => getTagsForSession(s).subject));
        return ['All', ...Array.from(subs)];
    }, [sessions]);

    const availableExamTypes = useMemo(() => {
        const types = new Set(sessions.map(s => getTagsForSession(s).examType));
        return ['All', ...Array.from(types)];
    }, [sessions]);

    // Apply Client-Side Filtering & Sorting
    const processedSessions = useMemo(() => {
        let result = [...sessions];

        if (searchQuery.trim()) {
            result = result.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (filterSubject !== 'All') {
            result = result.filter(s => getTagsForSession(s).subject === filterSubject);
        }

        if (filterExamType !== 'All') {
            result = result.filter(s => getTagsForSession(s).examType === filterExamType);
        }

        if (sortBy === 'Newest') {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sortBy === 'Oldest') {
            result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        } else if (sortBy === 'Most Studied') {
            // Mock sort by title length simulating study depth metadata proxy
            result.sort((a, b) => b.title.length - a.title.length);
        }

        return result;
    }, [sessions, searchQuery, filterSubject, filterExamType, sortBy]);

    useEffect(() => {
        getSessions().then(data => {
            setSessions(data);
            setIsLoading(false);
        });
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            <div className="flex items-center gap-4 border-b border-slate-800/80 pb-6">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <History className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 tracking-tight">
                        History & Archives
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">Review your past study plans and generated mock exams.</p>
                </div>
            </div>

            {/* Library Controls */}
            {!isLoading && sessions.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                    {/* Search */}
                    <div className="relative w-full md:w-80 flex-shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search archives by title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-sm text-slate-200 transition-all placeholder:text-slate-500 shadow-inner"
                        />
                    </div>

                    {/* Filters & Sort */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar mask-edges">
                        <div className="flex items-center gap-2 bg-slate-950/40 rounded-xl border border-slate-800 px-3 py-1.5 min-w-[140px] focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                            <Tag className="w-3.5 h-3.5 text-indigo-400" />
                            <select
                                value={filterSubject}
                                onChange={(e) => setFilterSubject(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-300 outline-none w-full appearance-none cursor-pointer tracking-wide"
                            >
                                {availableSubjects.map((sub, idx) => <option key={`sub-${sub}-${idx}`} value={sub} className="bg-slate-900">{sub === 'All' ? 'All Subjects' : sub}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-950/40 rounded-xl border border-slate-800 px-3 py-1.5 min-w-[140px] focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                            <select
                                value={filterExamType}
                                onChange={(e) => setFilterExamType(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-300 outline-none w-full appearance-none cursor-pointer tracking-wide"
                            >
                                {availableExamTypes.map((type, idx) => <option key={`type-${type}-${idx}`} value={type} className="bg-slate-900">{type === 'All' ? 'All Exam Types' : type}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-950/40 rounded-xl border border-slate-800 px-3 py-1.5 min-w-[140px] focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                            <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-300 outline-none w-full appearance-none cursor-pointer tracking-wide"
                            >
                                <option value="Newest" className="bg-slate-900">Newest First</option>
                                <option value="Oldest" className="bg-slate-900">Oldest First</option>
                                <option value="Most Studied" className="bg-slate-900">Most Studied</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="text-slate-500 animate-pulse font-medium">Loading archives...</div>
            ) : sessions.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-12 flex flex-col items-center text-center">
                    <BookOpen className="w-12 h-12 text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-300 mb-2">No archives found</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">You haven&apos;t generated any study sessions yet. Upload a syllabus in the Arena to get started.</p>
                    <Link href="/arena" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all">
                        Enter the Arena
                    </Link>
                </div>
            ) : processedSessions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border border-slate-800 border-dashed rounded-3xl bg-slate-900/20">
                    <Search className="w-10 h-10 mx-auto text-slate-600 mb-4 opacity-50" />
                    <p className="font-medium text-lg text-slate-400">No matching sessions found.</p>
                    <button onClick={() => { setSearchQuery(''); setFilterSubject('All'); setFilterExamType('All'); }} className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 font-bold">Clear filters</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {processedSessions.map((session, idx) => {
                        const tags = getTagsForSession(session);
                        return (
                            <Link href={`/chat?session=${session.id}`} key={`session-${session.id}-${idx}`} className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:bg-slate-800/90 hover:border-indigo-500/50 transition-all rounded-3xl p-6 flex flex-col justify-between group cursor-pointer hover:-translate-y-1.5 shadow-lg hover:shadow-[0_10px_30px_rgba(99,102,241,0.1)]">
                                <div className="flex justify-between items-start mb-5">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-colors bg-slate-800/50 border-slate-700/50 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30">
                                        <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                    </div>
                                    <div className="bg-slate-950/80 text-slate-400 text-xs font-bold px-2.5 py-1 rounded-lg tracking-wider border border-slate-800 flex items-center gap-1.5 shadow-sm">
                                        <Clock className="w-3 h-3 text-indigo-500/70" />
                                        {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-slate-200 font-bold mb-4 line-clamp-2 leading-snug group-hover:text-indigo-200 transition-colors text-lg tracking-tight">{session.title}</h3>

                                    {/* Virtual Metadata Tags */}
                                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-800/50">
                                        <span className="text-[10px] uppercase font-black tracking-wider px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 truncate max-w-full">
                                            {tags.subject}
                                        </span>
                                        <span className="text-[10px] uppercase font-black tracking-wider px-2 py-1 rounded-md bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
                                            {tags.examType}
                                        </span>
                                        <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-1 rounded-md border ${tags.difficultyColor}`}>
                                            {tags.difficulty}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
