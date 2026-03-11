'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react';
import clsx from 'clsx';

export default function PomodoroTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'Study' | 'Break'>('Study');

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive) {
            interval = setInterval(() => {
                setTimeLeft((time) => {
                    if (time <= 1) {
                        setIsActive(false); // require manual start for next phase
                        setMode(prev => prev === 'Study' ? 'Break' : 'Study');
                        return mode === 'Study' ? 5 * 60 : 25 * 60;
                    }
                    return time - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, mode]);

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
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 w-64 shadow-2xl">
            <div className="flex bg-slate-800/50 p-1 rounded-xl">
                <button
                    onClick={() => switchMode('Study')}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all",
                        mode === 'Study' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    )}
                >
                    <BookOpen className="w-3.5 h-3.5" /> Study
                </button>
                <button
                    onClick={() => switchMode('Break')}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all",
                        mode === 'Break' ? "bg-emerald-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    )}
                >
                    <Coffee className="w-3.5 h-3.5" /> Break
                </button>
            </div>

            <div className="text-center font-mono text-4xl font-black tracking-widest text-slate-100">
                {minutes}:{seconds}
            </div>

            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={toggleTimer}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all border",
                        isActive
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                            : "bg-indigo-500 hover:bg-indigo-400 text-white border-transparent"
                    )}
                >
                    {isActive ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4 ml-1" /> Start</>}
                </button>
                <button
                    onClick={resetTimer}
                    className="w-10 h-10 flex flex-shrink-0 items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
