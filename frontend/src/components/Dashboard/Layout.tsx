import React from 'react';
import { DashboardNavbar } from "../navigation/Navigation";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col w-full min-h-screen bg-slate-50 dark:bg-slate-900">
    <DashboardNavbar />
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
      {children}
    </main>
  </div>
);