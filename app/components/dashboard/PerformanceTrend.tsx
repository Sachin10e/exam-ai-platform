'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const mockScores = [
    { id: '1', score: 65 },
    { id: '2', score: 72 },
    { id: '3', score: 68 },
    { id: '4', score: 85 },
    { id: '5', score: 82 },
    { id: '6', score: 91 },
    { id: '7', score: 88 },
];

export default function PerformanceTrend() {
    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col h-full hover:bg-slate-800/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-medium text-slate-200">Mock Test Performance</h2>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mock Scores</p>
                    </div>
                </div>
                <div className="text-2xl font-bold tracking-tight text-emerald-400">+12%</div>
            </div>

            <div className="h-56 w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockScores} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="id"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `Test ${value}`}
                            dy={10}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                            cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
                            labelStyle={{ color: '#94a3b8', fontWeight: '500', marginBottom: '4px' }}
                            formatter={(value: unknown) => [`${value as string | number}%`, 'Score']}
                            labelFormatter={(label) => `Test ${label}`}
                        />
                        <Area type="monotone" dataKey="score" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
