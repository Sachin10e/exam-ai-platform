'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, BookOpen, Calculator, BrainCircuit, Activity, Clock, ChevronRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getSessions, StudySessionMeta } from './actions/sessions';
import { getDashboardStats, DashboardStats } from '../lib/analytics/dashboardStats';
import dynamic from 'next/dynamic';
import StatCard from './components/dashboard/StatCard';
import StudyStreakWidget from './components/dashboard/StudyStreakWidget';
import ErrorBoundary from './components/ui/ErrorBoundary';
const WeakTopics = dynamic(() => import('./components/dashboard/WeakTopics'), {
  loading: () => <div className="w-full h-[350px] bg-slate-900/40 border border-slate-800/50 rounded-2xl animate-pulse"></div>
});
const ExamCountdown = dynamic(() => import('./components/dashboard/ExamCountdown'), {
  loading: () => <div className="w-full h-[250px] bg-slate-900/40 border border-slate-800/50 rounded-2xl animate-pulse"></div>
});
const PerformanceTrend = dynamic(() => import('./components/dashboard/PerformanceTrend'), {
  ssr: false,
  loading: () => <div className="w-full h-[350px] bg-slate-900/40 border border-slate-800/50 rounded-2xl animate-pulse"></div>
});
const ExamPredictions = dynamic(() => import('./components/dashboard/ExamPredictions'), {
  loading: () => <div className="w-full h-[280px] bg-slate-900/40 border border-slate-800/50 rounded-2xl animate-pulse"></div>
});

const ProgressChart = dynamic(() => import('./components/dashboard/ProgressChart'), {
  ssr: false,
  loading: () => <div className="w-full bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 h-80 animate-pulse flex items-center justify-center text-slate-500 font-medium">Loading metrics...</div>
});

export default function DashboardPage() {
  const [recentSessions, setRecentSessions] = useState<StudySessionMeta[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const fetchDashboardData = () => {
      setIsLoading(true);
      getSessions().then(data => {
        setRecentSessions(data.slice(0, 6)); // Grab only the 6 most recent
        setIsLoading(false);
      });
      getDashboardStats().then(setStats);
    };

    fetchDashboardData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        fetchDashboardData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="max-w-[1400px] mx-auto p-6 flex flex-col gap-y-6">
      {/* Hero Welcome */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 tracking-tight">
          Welcome back, {displayName}.
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          You&apos;ve generated <strong>{recentSessions.length > 0 ? 'several advanced' : 'no completely'}</strong> study plans this week. Ready to conquer your next syllabus?
        </p>
      </div>

      {/* Quick Actions / Metrics */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <StatCard title="PDFs Uploaded" value={stats?.pdfCount ?? "-"} icon={FileText} color="indigo" isLoading={!stats} />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <StatCard title="Plans Generated" value={stats?.plansGenerated ?? "-"} icon={BrainCircuit} color="fuchsia" isLoading={!stats} />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <StatCard title="Mock Avg Score" value={stats ? `${stats.mockAverageScore}%` : "-"} icon={Activity} color="emerald" isLoading={!stats} />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <StudyStreakWidget streak={stats?.studyStreak ?? 0} bestStreak={stats?.bestStreak ?? 0} isLoading={!stats} />
        </div>
      </div>

      {/* Analytics & Insights 12-Column Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Row 2 */}
          <div className="col-span-12 lg:col-span-8 flex flex-col">
            <ErrorBoundary section="Progress Chart" compact>
              <ProgressChart />
            </ErrorBoundary>
          </div>
          <div className="col-span-12 lg:col-span-4 flex flex-col">
            <ErrorBoundary section="Exam Countdown" compact>
              <ExamCountdown />
            </ErrorBoundary>
          </div>

          {/* Row 3 */}
          <div className="col-span-12 lg:col-span-6 flex flex-col">
            <ErrorBoundary section="Performance Trends" compact>
              <PerformanceTrend />
            </ErrorBoundary>
          </div>
          <div className="col-span-12 lg:col-span-6 flex flex-col">
            <ErrorBoundary section="Weak Topics" compact>
              <WeakTopics />
            </ErrorBoundary>
          </div>

          {/* Row 4 */}
          <div className="col-span-12 flex flex-col">
            <ErrorBoundary section="Exam Predictions" compact>
              <ExamPredictions />
            </ErrorBoundary>
          </div>
        </div>

      {/* Recent Sessions Grid */}
      <div className="flex flex-col gap-y-6 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-200">Recent Archives</h2>
          <button className="text-indigo-400 text-sm hover:text-indigo-300 font-medium transition-colors">
            View all history
          </button>
        </div>

        {isLoading ? (
          <div className="text-slate-500 text-sm animate-pulse">Loading recent activity...</div>
        ) : recentSessions.length === 0 ? (
          <div className="card-standard border-dashed p-12 min-h-[50vh] flex flex-col flex-1 items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No active study plans</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">You haven&apos;t generated any study paths yet. Upload a syllabus or textbook to begin structuring your knowledge.</p>
            <Link href="/arena" className="btn-primary">
              Enter the Arena
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {recentSessions.map(session => (
              <div key={session.id} className="col-span-12 md:col-span-6 lg:col-span-4">
                <Link href={`/chat?session=${session.id}`} className="card-standard hover:bg-slate-800/50 hover:border-indigo-500/30 p-5 flex items-center gap-4 group cursor-pointer h-full">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shrink-0 shadow-inner">
                    <Calculator className="w-6 h-6 text-indigo-400 group-hover:scale-110 group-hover:text-indigo-300 transition-all duration-300" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 gap-1">
                    <h3 className="text-slate-200 font-bold text-sm truncate">{session.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs tracking-wider font-semibold text-slate-500 uppercase">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(session.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}