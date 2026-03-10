'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, BookOpen, Clock, Calculator, ChevronLeft } from 'lucide-react';
import { getSessions, StudySessionMeta } from '../actions/sessions';

export default function HistoryPage() {
    const [sessions, setSessions] = useState<StudySessionMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                        History & Archives
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">Review your past study plans and generated mock exams.</p>
                </div>
            </div>

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
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sessions.map(session => (
                        <Link href={`/chat?session=${session.id}`} key={session.id} className="bg-slate-900/40 border border-slate-800/50 hover:bg-slate-800/80 hover:border-indigo-500/30 transition-all rounded-3xl p-6 flex flex-col justify-between group cursor-pointer hover:-translate-y-1 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                                    <Calculator className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="bg-slate-800/80 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-md tracking-wider uppercase">
                                    Archived
                                </div>
                            </div>
                            <div>
                                <h3 className="text-slate-200 font-bold mb-2 line-clamp-2 leading-snug">{session.title}</h3>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    {new Date(session.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
