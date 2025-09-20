import React from 'react';
import { DashboardNavbar } from "../navigation/Navigation";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col w-full min-h-screen bg-ink">
    <DashboardNavbar />
    <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
      {children}
    </main>
  </div>
);