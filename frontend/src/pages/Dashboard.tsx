import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/Dashboard/Layout';
import { FileText, TrendingUp, Clock, Award, Plus, BarChart3, BookOpen, Calendar } from 'lucide-react';
import { Button } from '../components/ui/components';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
}

const StatsCard = ({ title, value, icon, trend, trendLabel }: StatsCardProps) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
    <div className="flex justify-between items-start mb-4">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</div>
    {trend !== undefined && (
      <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
      </div>
    )}
  </div>
);

const RecentPaperCard = ({ title, date, progress }: { title: string, date: string, progress: number }) => (
  <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-3">
    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg mr-4 border border-slate-200 dark:border-slate-600">
      <FileText size={20} className="text-blue-600" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-slate-900 dark:text-white truncate">{title}</h3>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-slate-500">{date}</span>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{progress}% complete</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 mt-2">
        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [userPapers] = useState<{ title: string, date: string, progress: number }[]>([]);
  const hasPapers = userPapers.length > 0;

  const handleNewPaper = () => navigate('/generate');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <Button variant="primary" size="md" onClick={handleNewPaper}>
            <Plus className="w-4 h-4 mr-2" />
            New Paper
          </Button>
        </div>

        {hasPapers ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard title="Total Papers" value={userPapers.length.toString()} icon={<FileText size={18} />} trend={8} trendLabel="this month" />
              <StatsCard title="Plagiarism Score" value="97%" icon={<Award size={18} />} trend={3} trendLabel="vs last paper" />
              <StatsCard title="Average Quality" value="A+" icon={<TrendingUp size={18} />} trend={5} trendLabel="improvement" />
              <StatsCard title="Time Saved" value="42 hrs" icon={<Clock size={18} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Papers</h2>
                <div className="space-y-3">
                  {userPapers.map((paper, index) => (
                    <RecentPaperCard key={index} title={paper.title} date={paper.date} progress={paper.progress} />
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm"><Calendar size={16} className="mr-2" />Calendar</Button>
                  <Button variant="outline" size="sm"><BookOpen size={16} className="mr-2" />Library</Button>
                  <Button variant="outline" size="sm"><BarChart3 size={16} className="mr-2" />Analytics</Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
              <FileText size={32} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Create Your First Paper</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center">
              Generate high-quality academic papers with AI assistance, citations, and built-in quality control.
            </p>
            <Button variant="primary" size="lg" onClick={handleNewPaper}>
              <Plus className="w-4 h-4 mr-2" />
              Create Paper
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
