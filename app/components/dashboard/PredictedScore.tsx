'use client';

import React, { useEffect, useState } from 'react';
import { getMockTestScores } from '@/app/actions/progress';
import { TrendingUp } from 'lucide-react';

export default function PredictedScore() {
  const [predictedScore, setPredictedScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testCount, setTestCount] = useState(0);

  useEffect(() => {
    getMockTestScores().then((scores) => {
      if (!scores || scores.length === 0) {
        setPredictedScore(null);
        setTestCount(0);
      } else {
        setTestCount(scores.length);
        const avg = scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length;
        const recentScores = scores.slice(-3);
        const recentAvg = recentScores.reduce((sum, s) => sum + (s.score || 0), 0) / recentScores.length;
        const trend = scores.length >= 3 ? (recentAvg - avg) * 0.3 : 0;
        const predicted = Math.min(100, Math.max(0, Math.round(avg + trend)));
        setPredictedScore(predicted);
      }
      setIsLoading(false);
    });
  }, []);

  const getColor = (score: number) => {
    if (score >= 75) return { stroke: '#10b981', text: 'text-emerald-400', label: 'On Track', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 50) return { stroke: '#f59e0b', text: 'text-amber-400', label: 'Needs Work', bg: 'bg-amber-500/10 border-amber-500/20' };
    return { stroke: '#ef4444', text: 'text-rose-400', label: 'At Risk', bg: 'bg-rose-500/10 border-rose-500/20' };
  };

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = predictedScore !== null ? (predictedScore / 100) * circumference : 0;

  if (isLoading) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6 h-full animate-pulse" />
    );
  }

  if (predictedScore === null) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col h-full hover:bg-slate-800/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-slate-200">Predicted Score</h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">AI Estimate</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mb-3">
            <span className="text-2xl font-black text-slate-600">—</span>
          </div>
          <p className="text-xs text-slate-500 max-w-[160px] leading-relaxed">Take a mock exam to unlock your predicted score</p>
        </div>
      </div>
    );
  }

  const colors = getColor(predictedScore);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col h-full hover:bg-slate-800/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-slate-200">Predicted Score</h2>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Based on {testCount} mock test{testCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64" cy="64" r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="10"
            />
            <circle
              cx="64" cy="64" r={radius}
              fill="none"
              stroke={colors.stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${colors.text}`}>{predictedScore}%</span>
            <span className="text-xs text-slate-500 font-medium">predicted</span>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full border text-xs font-bold ${colors.bg} ${colors.text}`}>
          {colors.label}
        </div>

        <p className="text-xs text-slate-600 text-center max-w-[180px] leading-relaxed">
          Take more mock tests to improve accuracy
        </p>
      </div>
    </div>
  );
}
