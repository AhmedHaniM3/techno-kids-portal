'use client';

import { useApp } from '@/lib/app-context';
import { LoginScreen } from '@/components/login-screen';
import OwnerDashboard from '@/components/portals/owner-dashboard';
import InstructorPortal from '@/components/portals/instructor-portal';
import ParentPortal from '@/components/portals/parent-portal';

export function AppContent() {
  const { currentUser, loading, error } = useApp();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">Loading Techno Kids Kafr Abdo…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-destructive mb-2">Connection Error</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (currentUser.role === 'owner') {
    return <OwnerDashboard />;
  }

  if (currentUser.role === 'instructor') {
    return <InstructorPortal />;
  }

  return <ParentPortal />;
}