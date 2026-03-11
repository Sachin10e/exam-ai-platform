'use client';

import React from 'react';
import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

export type StatCardColor = 'indigo' | 'fuchsia' | 'emerald' | 'amber' | 'blue';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: StatCardColor;
}

const colorMap = {
    indigo: {
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20',
        icon: 'text-indigo-400',
    },
    fuchsia: {
        bg: 'bg-fuchsia-500/10',
        border: 'border-fuchsia-500/20',
        icon: 'text-fuchsia-400',
    },
    emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        icon: 'text-emerald-400',
    },
    amber: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        icon: 'text-amber-400',
    },
    blue: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        icon: 'text-blue-400',
    }
};

export default function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
    const styles = colorMap[color] || colorMap.indigo;

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-slate-800/60 hover:border-slate-700 w-full">
            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center border", styles.bg, styles.border)}>
                <Icon className={clsx("w-6 h-6", styles.icon)} />
            </div>
            <div>
                <div className="text-3xl font-extrabold text-slate-100 tracking-tight">{value}</div>
                <div className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider">{title}</div>
            </div>
        </div>
    );
}
