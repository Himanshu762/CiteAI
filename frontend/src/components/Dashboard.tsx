import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/Dashboard/Layout';
import { FileText, TrendingUp, Clock, Award, FilePlus } from 'lucide-react';
import { Button, PageHeader } from '../components/ui/components';

const StatsCard = ({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend?: number }) => (
  <div className="bg-card border-2 border-border p-6 rounded-lg shadow-lg transition-all duration-300 hover:border-gold-leaf/50 hover:bg-ink">
    <div className="flex justify-between items-start mb-4">
      <span className="font-serif text-lg font-semibold text-muted-ink">{title}</span>
      <div className="p-2 bg-gold-leaf/10 rounded-md text-gold-leaf">{icon}</div>
    </div>
    <div className="text-4xl font-bold text-parchment mb-1">{value}</div>
    {trend !== undefined && (
      <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs. last month
      </div>
    )}
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const handleNewPaper = () => navigate('/generate');

  // Mock data - in a real app this would come from an API
  const userPapers = []; // Keep it empty to show the elegant empty state

  return (
    <DashboardLayout>
      <div className="space-y-8 w-full">
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <PageHeader title="Dashboard" />
          <Button onClick={handleNewPaper} className="w-full md:w-auto mt-4 md:mt-0">
            <FilePlus className="mr-2" /> New Manuscript
          </Button>
        </div>

        {userPapers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {/* Stats Cards would be rendered here */}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-card border-2 border-dashed border-border rounded-lg shadow-inner">
            <FileText size={64} className="text-muted-ink mb-6" />
            <h2 className="text-3xl font-bold font-serif text-primary mb-2">Your Scriptorium is Empty</h2>
            <p className="text-muted-ink mb-8 max-w-md text-center">
              Begin your journey by creating your first AI-assisted manuscript.
            </p>
            <Button onClick={handleNewPaper} size="lg" className="px-8">
              Create First Manuscript
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}