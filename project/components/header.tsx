'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HeaderProps {
  roleLabel: string;
}

export default function Header({ roleLabel }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo & Academy Name */}
        <div className="flex items-center gap-4">
          <img 
            src="/logo.png" 
            alt="Techno Kids Logo" 
            className="h-14 w-auto object-contain" 
          />
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Techno Kids Kafr Abdo</h1>
            <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">{roleLabel}</p>
          </div>
        </div>

        {/* User Profile & Logout */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-right">
              <div className="bg-slate-100 p-2 rounded-full text-slate-600">
                <UserIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{user.name || user.username}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-700 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}

      </div>
    </header>
  );
}