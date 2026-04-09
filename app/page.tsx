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

const PredictedScore = dynamic(() => import('./components/dashboard/PredictedScore'), {
  ssr: false,
  loading: () => <div className="w-full h-[280px] bg-slate-900/40 border border-slate-800/50 rounded-2xl animate-pulse"></div>
});

import { useAuth } from './providers/AuthProvider';

export default function DashboardPage() {
  const [recentSessions, setRecentSessions] = useState<StudySessionMeta[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = () => {
      setIsLoading(true);
      getSessions()
        .then(data => {
          setRecentSessions(data.slice(0, 6));
        })
        .catch(err => console.error('Failed to load sessions:', err))
        .finally(() => setIsLoading(false));
      getDashboardStats().then(setStats).catch(err => console.error('Failed to load stats:', err));
    };

    fetchDashboardData();

    // Re-fetch data when auth state changes (login/logout)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchDashboardData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 flex flex-col gap-y-4 md:gap-y-6">
      {/* Hero Welcome */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 tracking-tight">
          Welcome back, {displayName}.
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl">
          You&apos;ve generated <strong>{recentSessions.length > 0 ? 'several advanced' : 'no completely'}</strong> study plans this week. Ready to conquer your next syllabus?
        </p>
      </div>

      {/* Quick Actions / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="PDFs Uploaded" value={stats?.pdfCount ?? "-"} icon={FileText} color="indigo" isLoading={!stats} />
        <StatCard title="Plans Generated" value={stats?.plansGenerated ?? "-"} icon={BrainCircuit} color="fuchsia" isLoading={!stats} />
        <StatCard title="Mock Avg Score" value={stats ? `${stats.mockAverageScore}%` : "-"} icon={Activity} color="emerald" isLoading={!stats} />
        <StudyStreakWidget streak={stats?.studyStreak ?? 0} bestStreak={stats?.bestStreak ?? 0} isLoading={!stats} />
      </div>

      {/* Analytics & Insights 12-Column Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Row 2 */}
          <div className="col-span-12 lg:col-span-8">
            <ErrorBoundary section="Progress Chart" compact>
              <ProgressChart />
            </ErrorBoundary>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <ErrorBoundary section="Exam Countdown" compact>
              <ExamCountdown />
            </ErrorBoundary>
          </div>

          {/* Row 3 */}
          <div className="col-span-12 lg:col-span-6">
            <ErrorBoundary section="Performance Trends" compact>
              <PerformanceTrend />
            </ErrorBoundary>
          </div>
          <div className="col-span-12 lg:col-span-6">
            <ErrorBoundary section="Weak Topics" compact>
              <WeakTopics />
            </ErrorBoundary>
          </div>

          {/* Row 4 */}
          <div className="col-span-12 lg:col-span-4">
            <ErrorBoundary section="Predicted Score" compact>
              <PredictedScore />
            </ErrorBoundary>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <ErrorBoundary section="Exam Predictions" compact>
              <ExamPredictions />
            </ErrorBoundary>
          </div>
        </div>

      {/* Recent Sessions Grid */}
      <div className="flex flex-col gap-y-4 md:gap-y-6 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-slate-200">Recent Archives</h2>
          <button className="text-indigo-400 text-sm hover:text-indigo-300 font-medium transition-colors">
            View all history
          </button>
        </div>

        {isLoading ? (
          <div className="text-slate-500 text-sm animate-pulse">Loading recent activity...</div>
        ) : recentSessions.length === 0 ? (
          <div className="flex flex-col gap-6 py-6">
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                <BookOpen className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-200 mb-2">Welcome to ExamArena</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">Get started in 3 simple steps. Your first AI study plan takes less than 60 seconds.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto w-full">
              <Link href="/arena" className="group flex flex-col gap-3 p-5 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl transition-all hover:-translate-y-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Step 1</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 mb-1">Upload your syllabus</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Upload any PDF, DOCX, or image of your course material</p>
                </div>
                <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform mt-auto">Start here →</span>
              </Link>

              <div className="flex flex-col gap-3 p-5 bg-slate-900/40 border border-slate-800/50 rounded-2xl opacity-70">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-full">Step 2</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 mb-1">Generate your plan</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">AI creates unit-by-unit questions, answers, and MCQs</p>
                </div>
                <span className="text-xs text-slate-600 mt-auto">Unlocks after Step 1</span>
              </div>

              <div className="flex flex-col gap-3 p-5 bg-slate-900/40 border border-slate-800/50 rounded-2xl opacity-70">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Step 3</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 mb-1">Test your knowledge</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Take mock exams, review flashcards, track your score</p>
                </div>
                <span className="text-xs text-slate-600 mt-auto">Unlocks after Step 2</span>
              </div>
            </div>
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