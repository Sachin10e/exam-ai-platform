'use client';

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getWeeklyActivity, WeeklyActivity } from '@/app/actions/progress';
import { Activity } from 'lucide-react';

export default function ProgressChart() {
    const [data, setData] = useState<WeeklyActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getWeeklyActivity().then((res) => {
            setData(res);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return (
            <div className="w-full bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 h-80 animate-pulse"></div>
        );
    }

    const hasData = data.some(d => d.hours > 0);
    const mockData = [
        { day: 'Sun', hours: 2.5 }, { day: 'Mon', hours: 3.8 }, { day: 'Tue', hours: 1.5 },
        { day: 'Wed', hours: 4.2 }, { day: 'Thu', hours: 3.0 }, { day: 'Fri', hours: 5.5 },
        { day: 'Sat', hours: 2.0 }
    ];
    const displayData = hasData ? data : mockData;

    return (
        <div className="w-full h-full bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col gap-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 group">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-sm font-medium text-slate-200">Study Velocity {!hasData && <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-md">Sample</span>}</h2>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hours Tracked Per Day</p>
                </div>
            </div>

            <div className="w-full h-[220px] md:h-[300px] shrink-0 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f1f5f9' }}
                                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '3 3' }}
                            />
                            <Area type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
