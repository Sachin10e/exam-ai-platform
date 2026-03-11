'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, FileText, BookOpen, Calculator, BrainCircuit, Activity, Clock, ChevronRight } from 'lucide-react';
import { getSessions, StudySessionMeta } from './actions/sessions';
import dynamic from 'next/dynamic';
import StatCard from './components/dashboard/StatCard';
import StudyStreakWidget from './components/dashboard/StudyStreakWidget';
import AIInsights from './components/dashboard/AIInsights';
import StudyPlanList from './components/dashboard/StudyPlanList';
import WeakTopics from './components/dashboard/WeakTopics';
import ExamCountdown from './components/dashboard/ExamCountdown';
import PerformanceTrend from './components/dashboard/PerformanceTrend';
import ExamPredictions from './components/dashboard/ExamPredictions';
import RevisionScheduler from './components/dashboard/RevisionScheduler';

const ProgressChart = dynamic(() => import('./components/dashboard/ProgressChart'), {
  ssr: false,
  loading: () => <div className="w-full bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 h-80 animate-pulse flex items-center justify-center text-slate-500 font-medium">Loading metrics...</div>
});

export default function DashboardPage() {
  const [recentSessions, setRecentSessions] = useState<StudySessionMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSessions().then(data => {
      setRecentSessions(data.slice(0, 6)); // Grab only the 6 most recent
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Welcome */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
          Welcome back, Student.
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          You&apos;ve generated <strong>{recentSessions.length > 0 ? 'several advanced' : 'no completely'}</strong> study plans this week. Ready to conquer your next syllabus?
        </p>
      </div>

      {/* Quick Actions / Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="PDFs Uploaded" value="12" icon={FileText} color="indigo" />
        <StatCard title="Plans Generated" value={recentSessions.length || 0} icon={BrainCircuit} color="fuchsia" />
        <StatCard title="Mock Avg Score" value="84%" icon={Activity} color="emerald" />
        <StudyStreakWidget />

        <Link href="/arena" className="group bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 transition-all rounded-3xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.2)] flex flex-col justify-between items-start cursor-pointer hover:-translate-y-1">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="w-full flex justify-between items-center mt-4">
            <div className="text-xl font-bold text-white">New Area</div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white transition-colors">
              <ChevronRight className="w-4 h-4 text-white group-hover:text-indigo-600 transition-colors" />
            </div>
          </div>
        </Link>
      </div>

      {/* Analytics & Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ProgressChart />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PerformanceTrend />
            <WeakTopics />
          </div>
          <ExamPredictions />
        </div>
        <div className="flex flex-col gap-6">
          <ExamCountdown />
          <StudyPlanList />
          <AIInsights />
          <RevisionScheduler />
        </div>
      </div>

      {/* Recent Sessions Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-200">Recent Archives</h2>
          <button className="text-indigo-400 text-sm hover:text-indigo-300 font-medium transition-colors">
            View all history
          </button>
        </div>

        {isLoading ? (
          <div className="text-slate-500 text-sm animate-pulse">Loading recent activity...</div>
        ) : recentSessions.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-12 flex flex-col flex-1 items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No active study plans</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">You haven&apos;t generated any study paths yet. Upload a syllabus or textbook to begin structuring your knowledge.</p>
            <Link href="/arena" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all">
              Enter the Arena
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSessions.map(session => (
              <Link href={`/chat?session=${session.id}`} key={session.id} className="bg-slate-900/40 border border-slate-800/50 hover:bg-slate-800/80 hover:border-slate-700 transition-all rounded-3xl p-5 flex flex-col justify-between group cursor-pointer group hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                    <Calculator className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-slate-200 font-bold mb-1 truncate">{session.title}</h3>
                <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                  <Clock className="w-3 h-3" />
                  {new Date(session.created_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}