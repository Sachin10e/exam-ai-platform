'use client';

import React from 'react';
import { CalendarClock } from 'lucide-react';

export default function ExamCountdown() {
    // Hardcoded for aesthetic demonstration 
    // In reality, this would calculate Math.abs(futureDate - Date.now()) / days
    const daysRemaining = 14;

    return (
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-5 flex flex-col justify-between h-full relative overflow-hidden group hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200">

            {/* Visual flair */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all"></div>

            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <CalendarClock className="w-5 h-5 text-indigo-300" />
                    </div>
                    <span className="text-sm font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-indigo-500/20">
                        Mid-Term 1
                    </span>
                </div>

                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 tracking-tighter">
                            {daysRemaining}
                        </span>
                        <span className="text-lg font-bold text-slate-400">days left</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 mt-2">
                        Time is ticking. Keep your streak alive!
                    </p>

                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-5 overflow-hidden">
                        <div className="bg-indigo-500 h-1.5 rounded-full w-[70%]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
