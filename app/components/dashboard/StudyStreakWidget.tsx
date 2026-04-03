'use client';

import React from 'react';
import { Flame } from 'lucide-react';

const StudyStreakWidget = ({ streak = 0, bestStreak = 0, isLoading }: { streak?: number, bestStreak?: number, isLoading?: boolean }) => {
    return (
        <div 
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col justify-between w-full h-full relative overflow-hidden group hover:-translate-y-1 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 hover:bg-slate-800/60 hover:border-slate-700">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>

            <div className="flex flex-col gap-4 z-10 relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                    <Flame className="w-5 h-5 text-amber-400" />
                </div>

                <div>
                    <div className="flex items-baseline gap-1">
                        {isLoading ? (
                            <div className="h-9 w-12 bg-slate-800 rounded-lg animate-pulse mb-1"></div>
                        ) : (
                            <>
                                <span className="text-3xl font-extrabold text-slate-100 tracking-tight">{streak}</span>
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{streak === 1 ? 'Day' : 'Days'}</span>
                            </>
                        )}
                    </div>
                    <div className="text-amber-500/90 text-sm font-medium mt-1 uppercase tracking-wider">Current Streak</div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-4 z-10 relative">
                <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">Best Streak</span>
                    {isLoading ? (
                        <div className="h-4 w-12 bg-slate-800 rounded animate-pulse"></div>
                    ) : (
                        <span className="text-xs font-black text-slate-300">{bestStreak} {bestStreak === 1 ? 'Day' : 'Days'}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default React.memo(StudyStreakWidget);
