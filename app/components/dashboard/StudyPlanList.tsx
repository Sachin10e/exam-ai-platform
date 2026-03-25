'use client';

import React, { useState, useEffect } from 'react';
import { ListChecks, Loader2, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

import { getDailyPlan, DailyTaskDef } from '@/lib/analytics/dailyPlan';

export default function StudyPlanList() {
    const [tasks, setTasks] = useState<DailyTaskDef[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getDailyPlan().then(data => {
            setTasks(data);
            setIsLoading(false);
        });
    }, []);

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
                {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-sm text-slate-400 text-center py-4">No tasks remaining! Great job.</div>
                ) : (
                    tasks.map((task) => (
                        <Link href={task.link} key={task.id} className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:border-indigo-500/30 transition-colors cursor-pointer">
                            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                {task.status === 'completed' ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <Circle className="w-5 h-5 text-slate-500 group-hover:text-indigo-400" />
                                )}
                            </div>
                            <span className="text-sm font-medium pr-2 text-slate-300 group-hover:text-slate-200 line-clamp-2">{task.title}</span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
