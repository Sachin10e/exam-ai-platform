'use client';

import React, { useState, useEffect } from 'react';
import { CalendarClock, Pencil } from 'lucide-react';

export default function ExamCountdown() {
    const [examDate, setExamDate] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('arena_exam_date');
        if (saved) setExamDate(saved);
    }, []);

    const daysRemaining = examDate
        ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    const progressWidth = (examDate && daysRemaining !== null)
        ? Math.max(0, Math.min(100, Math.round((1 - daysRemaining / 30) * 100)))
        : 0;

    return (
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-5 flex flex-col justify-between h-full relative overflow-hidden group hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200">

            {/* Visual flair */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all"></div>

            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <CalendarClock className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-indigo-500/20">
                                Mid-Term 1
                            </span>
                            <button onClick={() => setIsEditing(!isEditing)} className="p-1 text-slate-500 hover:text-indigo-400 transition-colors">
                                <Pencil className="w-3 h-3" />
                            </button>
                        </div>
                        {isEditing && (
                            <input
                                type="date"
                                value={examDate}
                                onChange={(e) => {
                                    setExamDate(e.target.value);
                                    localStorage.setItem('arena_exam_date', e.target.value);
                                }}
                                onBlur={() => setIsEditing(false)}
                                className="mt-2 bg-transparent border border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-300 outline-none focus:border-indigo-500 w-full"
                            />
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 tracking-tighter">
                            {daysRemaining !== null ? daysRemaining : '—'}
                        </span>
                        <span className="text-lg font-bold text-slate-400">
                            {daysRemaining === 1 ? 'day left' : 'days left'}
                        </span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 mt-2">
                        Time is ticking. Keep your streak alive!
                    </p>

                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-5 overflow-hidden">
                        <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressWidth}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
