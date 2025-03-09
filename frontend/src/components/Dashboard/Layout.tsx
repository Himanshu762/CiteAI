import React from 'react';
import { DashboardNavbar, DashboardSidebar } from "../navigation/Navigation";
import { BottomDock } from "../navigation/BottomDock";

type DashboardLayoutProps = {
  children: React.ReactNode
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => (
  <div className="flex flex-col w-full min-h-screen bg-neutral dark:bg-primary-900">
    <DashboardNavbar />
    <div className="flex-1 flex pt-20 w-full pb-16 md:pb-0">
      {/* Hide sidebar on small screens, show on medium and up */}
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>
      <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
        <div className="bg-neutral dark:bg-primary-800 rounded-lg shadow-sm p-4 md:p-6 w-full h-full">
          {children}
        </div>
      </main>
    </div>
    <BottomDock />
  </div>
); 