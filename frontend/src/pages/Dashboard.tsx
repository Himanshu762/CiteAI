import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/Dashboard/Layout';
import { 
  FileText, TrendingUp, Clock, Book,
  BarChart4, Calendar, Users, Award,
  FilePlus
} from 'lucide-react';
import { Button } from '../components/ui/components';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
}

const StatsCard = ({ title, value, icon, trend, trendLabel }: StatsCardProps) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex flex-col h-full">
    <div className="flex justify-between items-start mb-4">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
    {trend !== undefined && (
      <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
      </div>
    )}
  </div>
);

const RecentPaperCard = ({ title, date, progress }: { title: string, date: string, progress: number }) => (
  <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-3 w-full">
    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg mr-4">
      <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-gray-900 dark:text-white truncate">{title}</h3>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">{date}</span>
        <span className="text-xs font-medium">{progress}% complete</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5 dark:bg-gray-700">
        <div 
          className="bg-indigo-600 h-1.5 rounded-full dark:bg-indigo-400" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  // This would come from a backend API in a real app
  const [userPapers, setUserPapers] = useState<{title: string, date: string, progress: number}[]>([]);
  
  // For demo, we'll use a mock flag to indicate if user has papers or not
  const hasPapers = userPapers.length > 0;

  const handleNewPaper = () => {
    navigate('/generate');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 w-full">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button 
              variant="primary"
              size="md"
              onClick={handleNewPaper}
            >
              New Paper
            </Button>
          </div>
        </div>

        {hasPapers ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              <StatsCard 
                title="Total Papers" 
                value={userPapers.length.toString()} 
                icon={<FileText size={18} />}
                trend={8}
                trendLabel="this month"
              />
              <StatsCard 
                title="Plagiarism Score" 
                value="97%" 
                icon={<Award size={18} />}
                trend={3}
                trendLabel="vs last paper"
              />
              <StatsCard 
                title="Average Quality" 
                value="A+" 
                icon={<TrendingUp size={18} />}
                trend={5}
                trendLabel="improvement"
              />
              <StatsCard 
                title="Time Saved" 
                value="42 hrs" 
                icon={<Clock size={18} />}
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 h-full">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Papers</h2>
                <div className="space-y-3">
                  {userPapers.map((paper, index) => (
                    <RecentPaperCard 
                      key={index}
                      title={paper.title} 
                      date={paper.date} 
                      progress={paper.progress} 
                    />
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button variant="ghost" size="sm">View All Papers</Button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 h-full">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" className="flex items-center justify-center">
                    <Calendar size={16} className="mr-2" />
                    <span>Calendar</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center justify-center">
                    <Book size={16} className="mr-2" />
                    <span>Library</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center justify-center">
                    <BarChart4 size={16} className="mr-2" />
                    <span>Analytics</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center justify-center">
                    <Users size={16} className="mr-2" />
                    <span>Team</span>
                  </Button>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Tips</h3>
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
                    <p className="text-sm text-indigo-800 dark:text-indigo-300">Use AI to generate citations and bibliographies automatically for your papers.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Empty state when no papers exist
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-full mb-6">
              <FilePlus size={48} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Get Started with Your First Paper</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md text-center">
              Generate high-quality academic papers with AI assistance, citations, and built-in quality control.
            </p>
            <Button 
              variant="primary"
              size="lg"
              onClick={handleNewPaper}
              className="px-8"
            >
              Create Your First Paper
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 