'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen, Clock, Target, Maximize2, Minimize2 } from 'lucide-react';
import clsx from 'clsx';

export default function PomodoroTimer({ progress = 0, onSessionComplete }: { progress?: number, onSessionComplete?: (durationMinutes: number) => void }) {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'Study' | 'Break'>('Study');

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive) {
            interval = setInterval(() => {
                setTimeLeft((time) => {
                    if (time <= 1) {
                        setIsActive(false);
                        if (mode === 'Study' && onSessionComplete) {
                            setTimeout(() => onSessionComplete(25), 0);
                        }
                        setMode(prev => prev === 'Study' ? 'Break' : 'Study');
                        return mode === 'Study' ? 5 * 60 : 25 * 60;
                    }
                    return time - 1;
                });
            }, 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isActive, mode, onSessionComplete]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'Study' ? 25 * 60 : 5 * 60);
    };
    const switchMode = (newMode: 'Study' | 'Break') => {
        setIsActive(false);
        setMode(newMode);
        setTimeLeft(newMode === 'Study' ? 25 * 60 : 5 * 60);
    };

    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');

    return (
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-4 w-64 shadow-[0_20px_40px_rgba(0,0,0,0.4)] animate-in slide-in-from-top-4 fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-400" /> Session
                </span>
            </div>

            {/* Combined Progress Bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-300">Class Progress</span>
                    <span className="text-emerald-400 font-bold">{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Timer Modes */}
            <div className="flex bg-slate-950/50 p-1 rounded-xl shadow-inner border border-slate-800/50">
                <button
                    onClick={() => switchMode('Study')}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all",
                        mode === 'Study' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    <BookOpen className="w-3.5 h-3.5" /> Focus
                </button>
                <button
                    onClick={() => switchMode('Break')}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all",
                        mode === 'Break' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    <Coffee className="w-3.5 h-3.5" /> Rest
                </button>
            </div>

            {/* Clock Display */}
            <div className="text-center font-mono text-5xl font-black tracking-wider text-slate-100 drop-shadow-sm py-2">
                {minutes}:{seconds}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={toggleTimer}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm",
                        isActive
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white border-transparent"
                    )}
                >
                    {isActive ? <><Pause className="w-4 h-4 fill-current" /> Pause</> : <><Play className="w-4 h-4 fill-current ml-0.5" /> Start</>}
                </button>
                <button
                    onClick={resetTimer}
                    className="w-11 h-11 flex flex-shrink-0 items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-xl transition-all border border-slate-700/50"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
