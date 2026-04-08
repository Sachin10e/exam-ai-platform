'use client';

import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, Circle } from 'lucide-react';

type Task = { id: number; text: string; completed: boolean; };

const initialTasks: Task[] = [
    { id: 1, text: 'Unit 2: Deadlocks', completed: false },
    { id: 2, text: 'Flashcards: Database Keys', completed: false },
    { id: 3, text: 'Mock Test: Unit 3', completed: false }
];

export default function RevisionScheduler() {
    const [tasks, setTasks] = useState<Task[]>(() => {
        if (typeof window === 'undefined') return initialTasks;
        try {
            const saved = localStorage.getItem('revision_tasks');
            return saved ? JSON.parse(saved) : initialTasks;
        } catch { return initialTasks; }
    });

    useEffect(() => {
        localStorage.setItem('revision_tasks', JSON.stringify(tasks));
    }, [tasks]);

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    };

    const progress = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col card-hover">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <CalendarCheck className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-200">Today&apos;s Revision</h2>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Scheduled Tasks</p>
                    </div>
                </div>

                {/* Math-driven Circular Progress Indicator */}
                <div className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-800/50 border border-slate-700/50 relative shadow-inner">
                    <svg className="w-full h-full rotate-[-90deg] p-1.5" viewBox="0 0 36 36">
                        <path
                            className="text-slate-700/50"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                            className="text-blue-500 transition-all duration-500 ease-out"
                            strokeDasharray={`${progress}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <span className="absolute text-[0.6rem] font-bold text-slate-300">{progress}%</span>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {tasks.map((task) => (
                    <button
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`group flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 text-left ${task.completed
                                ? 'bg-slate-900/50 border-slate-800/50 opacity-70'
                                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5'
                            }`}
                    >
                        <div className={`shrink-0 transition-colors ${task.completed ? 'text-blue-500' : 'text-slate-500 group-hover:text-blue-400'}`}>
                            {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>
                        <span className={`text-sm font-semibold transition-all duration-300 ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'
                            }`}>
                            {task.text}
                        </span>
                    </button>
                ))}
            </div>
            <button 
                onClick={() => {
                    setTasks(initialTasks);
                    localStorage.removeItem('revision_tasks');
                }}
                className="text-xs text-slate-500 hover:text-slate-400 mt-4 self-end transition-colors"
                title="Reset to default tasks"
            >
                Reset
            </button>
        </div>
    );
}
