'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';

const predictions = [
    { id: 1, topic: 'Normalization', frequency: '7 appearances', importance: 'High' },
    { id: 2, topic: 'Deadlocks', frequency: '5 appearances', importance: 'Medium' },
    { id: 3, topic: 'B-Trees', frequency: '3 appearances', importance: 'Low' }
];

export default function ExamPredictions() {
    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col h-full hover:bg-slate-800/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 group">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h2 className="text-sm font-medium text-slate-200">High Probability Topics</h2>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">AI Exam Predictions</p>
                </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-700/50">
                <div className="grid grid-cols-12 gap-4 bg-slate-800/80 p-3 border-b border-slate-700/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-6 pl-2">Topic</div>
                    <div className="col-span-3 text-center">Frequency</div>
                    <div className="col-span-3 text-right pr-2">Importance</div>
                </div>
                <div className="flex flex-col bg-slate-800/20 divide-y divide-slate-700/50">
                    {predictions.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/40 transition-colors">
                            <div className="col-span-6 font-semibold text-slate-200 text-sm truncate pl-1">
                                {item.topic}
                            </div>
                            <div className="col-span-3 text-center text-xs font-medium text-slate-400">
                                {item.frequency}
                            </div>
                            <div className="col-span-3 flex justify-end">
                                <span className={`text-[0.65rem] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${item.importance === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                        item.importance === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                    {item.importance}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
