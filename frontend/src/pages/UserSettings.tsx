import { UserProfile } from '@clerk/clerk-react';
import { DashboardLayout } from '../components/Dashboard/Layout';
import { PageHeader } from '../components/ui/components';

export default function UserSettings() {
  return (
    <DashboardLayout>
      <PageHeader title="User Profile & Settings" />
      <div className="bg-card border-2 border-border rounded-lg p-6 lg:p-8 shadow-lg mt-8">
        <UserProfile 
          path="/settings"
          routing="path"
          appearance={{
            elements: {
              card: "shadow-none bg-transparent",
              headerTitle: "font-serif text-3xl text-parchment",
              headerSubtitle: "text-muted-ink",
              navbar: "hidden",
              profilePage: "w-full max-w-full",
              formFieldLabel: "text-secondary font-serif",
              formFieldInput: "bg-input border-border rounded-md text-foreground",
              formButtonPrimary: "bg-gold-leaf text-ink hover:bg-gold-leaf-light font-serif",
              accordionTriggerButton: "font-serif text-primary",
              accordionContent: "text-secondary",
              dangerSection: "border-red-500/30",
              dangerSectionTitle: "text-red-400 font-serif",
              profileSection__activeDevices: "border-t border-border",
              activeDeviceListItem: "border border-border rounded-md",
              dividerLine: "bg-border",
              navbarButton: "text-secondary font-serif hover:bg-card",
              navbarButton__active: "bg-card text-gold-leaf"
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
}