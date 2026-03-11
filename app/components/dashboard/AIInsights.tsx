'use client';

import React, { useEffect, useState } from 'react';
import { Target, Zap, BookCheck, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AIInsights() {
    const [isLoading, setIsLoading] = useState(true);

    // Mock Insights Data matching user structure
    const MOCK_INSIGHTS = [
        {
            id: 1,
            title: "Revise Deadlocks",
            description: "You scored consistently low in Operating Systems - Deadlocks. Generating a Mock Test focused purely on these units is highly recommended.",
            icon: Target,
            iconColor: "text-amber-400",
            actionText: "Start Revision",
            actionLink: "/arena?type=mock",
            borderColor: "border-amber-500/20"
        },
        {
            id: 2,
            title: "Take Unit 3 Mock Test",
            description: "You have completed reading Unit 3. Validate your mastery before proceeding further into the syllabus.",
            icon: Zap,
            iconColor: "text-emerald-400",
            actionText: "Start Revision",
            actionLink: "/arena?type=mock",
            borderColor: "border-emerald-500/20"
        },
        {
            id: 3,
            title: "Review Flashcards",
            description: "You haven't reviewed flashcards for your latest active syllabus. Quick repetition strengthens neural pathways before exams.",
            icon: BookCheck,
            iconColor: "text-fuchsia-400",
            actionText: "Start Revision",
            actionLink: "/arena?type=flashcard",
            borderColor: "border-fuchsia-500/20"
        }
    ];

    useEffect(() => {
        // Simulate network delay for the skeleton loader to maintain UX continuity
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="w-full bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 animate-pulse h-[340px]"></div>
        );
    }

    return (
        <div className="w-full bg-gradient-to-br from-indigo-900/20 to-slate-900/50 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden group h-full flex flex-col">
            {/* Decorative Blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:bg-indigo-500/20"></div>

            <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-lg font-bold text-slate-200">AI Study Suggestions</h2>
                </div>

                {/* Simulated empty state: Replace MOCK_INSIGHTS.length > 0 to test fallback */}
                {MOCK_INSIGHTS.length === 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-slate-700/50 border-dashed rounded-2xl bg-slate-800/20">
                        <Sparkles className="w-8 h-8 text-slate-600 mb-3" />
                        <p className="text-sm font-medium text-slate-400">Continue studying to unlock AI insights.</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {MOCK_INSIGHTS.map(insight => (
                            <li key={insight.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-2xl border ${insight.borderColor} hover:bg-slate-800/70 transition-colors`}>
                                <div className="flex items-start gap-4">
                                    <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700 shrink-0 shadow-inner">
                                        <insight.icon className={`w-5 h-5 ${insight.iconColor}`} />
                                    </div>
                                    <div className="py-1">
                                        <p className="text-sm font-bold text-slate-200 tracking-wide">{insight.title}</p>
                                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed xl:max-w-md">
                                            {insight.description}
                                        </p>
                                    </div>
                                </div>
                                <Link href={insight.actionLink} className="w-full sm:w-auto px-5 py-2.5 bg-slate-900/80 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all shadow-md flex justify-center items-center gap-2 shrink-0 group/btn">
                                    {insight.actionText}
                                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
