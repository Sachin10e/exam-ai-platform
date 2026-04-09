'use client';

import React, { useState, useEffect } from 'react';
import { Target, AlertTriangle, ChevronDown, BookOpen, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { getWeakTopics, WeakTopicDef } from '@/lib/analytics/weakTopics';

export default function WeakTopics() {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [weakTopics, setWeakTopics] = useState<WeakTopicDef[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getWeakTopics()
            .then(data => setWeakTopics(data))
            .catch(err => console.error('Failed to load weak topics:', err))
            .finally(() => setIsLoading(false));
    }, []);

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col h-full hover:bg-slate-800/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 group">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Target className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                    <h2 className="text-sm font-medium text-slate-200">Weak Topics</h2>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">AI Detected Flags</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {isLoading ? (
                    <div className="text-sm font-medium text-slate-500 animate-pulse py-4 text-center">Scanning performance metrics...</div>
                ) : weakTopics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                        <span className="text-3xl mb-2">🎉</span>
                        <h3 className="text-emerald-400 font-bold mb-1">On Track!</h3>
                        <p className="text-xs text-slate-400">Your mock exam scores consistently trace above the 60% confidence baseline.</p>
                    </div>
                ) : (
                    weakTopics.map((item) => (
                        <div key={item.id} className="flex flex-col rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors overflow-hidden">
                            
                            {/* Sticky Header Row (Always Visible) */}
                            <button 
                                onClick={() => toggleExpand(item.id)}
                                className="w-full text-left p-4 flex flex-col gap-3 focus:outline-none"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-200">{item.topic}</span>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${item.confidence < 65 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                item.confidence < 70 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                            Confidence: {item.confidence}%
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedId === item.id ? 'rotate-180 text-amber-400' : ''}`} />
                                    </div>
                                </div>
    
                                {/* Progress Bar Visualizer */}
                                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-1.5 rounded-full ${item.confidence < 65 ? 'bg-rose-500' :
                                                item.confidence < 70 ? 'bg-orange-500' :
                                                    'bg-amber-500'
                                            }`}
                                        style={{ width: `${item.confidence}%` }}
                                    ></div>
                                </div>
    
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <span className="text-xs font-medium text-slate-400">
                                        Suggested action: <strong className="text-slate-300">{item.action}</strong>
                                    </span>
                                </div>
                            </button>
    
                            {/* Collapsible Content */}
                            <AnimatePresence>
                                {expandedId === item.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: 'circOut' }}
                                        className="px-4 pb-4 overflow-hidden"
                                    >
                                        <div className="pt-3 border-t border-slate-700/50">
                                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                                {item.explanation}
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-semibold rounded-lg border border-indigo-500/20 transition-all text-xs active:scale-95 shadow-sm">
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                    Revise Topic
                                                </button>
                                                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 font-semibold rounded-lg border border-fuchsia-500/20 transition-all text-xs active:scale-95 shadow-sm">
                                                    <BrainCircuit className="w-3.5 h-3.5" />
                                                    Generate Quiz
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
    
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
