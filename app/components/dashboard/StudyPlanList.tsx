'use client';

import React from 'react';
import { ListChecks } from 'lucide-react';

export default function StudyPlanList() {
    // Hardcoded UI items based exactly on user's instruction
    const tasks = [
        { title: 'Revise Unit 2', status: 'pending' },
        { title: 'Review flashcards', status: 'pending' },
        { title: 'Take mock test', status: 'pending' }
    ];

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col h-full hover:bg-slate-800/60 transition-colors bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-900/40 to-slate-900/40">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <ListChecks className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-200">Today&apos;s Study Plan</h2>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Actionable Tasks</p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {tasks.map((task, idx) => (
                    <div key={idx} className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:border-indigo-500/30 transition-colors cursor-pointer">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex items-center justify-center group-hover:border-indigo-400">
                            {/* Clickable toggle simulation */}
                        </div>
                        <span className="text-sm font-medium text-slate-300 group-hover:text-slate-200">{task.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
