'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OwnerDashboard from '@/components/portals/owner-dashboard';
import InstructorPortal from '@/components/portals/instructor-portal';
import ParentPortal from '@/components/portals/parent-portal';
import { Button } from '@/components/ui/button';

export default function DashboardRouter() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      router.push('/login');
    } else {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('currentUser');
        router.push('/login');
      }
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('currentUser');
    router.push('/login');
  }

  if (!user) return <div className="p-8 text-center">Loading portal...</div>;

  const role = String(user.role || '').trim().toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Welcome, {user.name}</h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Role: {user.role}</p>
        </div>
        <Button onClick={handleLogout} variant="outline" size="sm">Sign Out</Button>
      </header>

      <main className="p-6">
        {role === 'owner' && <OwnerDashboard />}
        {role === 'instructor' && <InstructorPortal currentUser={user} />}
        {(role === 'parent' || (role !== 'owner' && role !== 'instructor')) && <ParentPortal currentUser={user} />}
      </main>
    </div>
  );
}