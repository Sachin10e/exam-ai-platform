'use client';

import React from 'react';
import { Target, AlertTriangle } from 'lucide-react';

// Hardcoded safe metrics mapping the user's explicit structural request
const weakTopics = [
    { id: 1, topic: 'Deadlocks', confidence: 62, action: 'Review Unit 3' },
    { id: 2, topic: 'Data Structures (Trees)', confidence: 68, action: 'Practice Mock Tests' },
    { id: 3, topic: 'Quantum Mechanics', confidence: 71, action: 'Review Flashcards' }
];

export default function WeakTopics() {
    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col h-full card-hover">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Target className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-200">Weak Topics</h2>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">AI Detected Flags</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {weakTopics.map((item) => (
                    <div key={item.id} className="flex flex-col p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-200">{item.topic}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${item.confidence < 65 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                    item.confidence < 70 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                Confidence: {item.confidence}%
                            </span>
                        </div>

                        {/* Progress Bar Visualizer */}
                        <div className="w-full bg-slate-900 rounded-full h-1.5 mb-3 overflow-hidden">
                            <div
                                className={`h-1.5 rounded-full ${item.confidence < 65 ? 'bg-rose-500' :
                                        item.confidence < 70 ? 'bg-orange-500' :
                                            'bg-amber-500'
                                    }`}
                                style={{ width: `${item.confidence}%` }}
                            ></div>
                        </div>

                        <div className="flex items-start gap-2 mt-auto">
                            <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-xs font-medium text-slate-400">
                                Suggested action: <strong className="text-slate-300">{item.action}</strong>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
