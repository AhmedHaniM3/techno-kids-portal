'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u && u.role) {
          router.push('/dashboard');
          return;
        }
      } catch (e) {}
    }
    router.push('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-slate-500 font-medium">Loading portal...</p>
    </div>
  );
}