'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import logoImage from '@/../public/logo.png';
import { useApp } from '@/lib/app-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Cpu, LogOut } from 'lucide-react';
import type { Role } from '@/lib/types';

interface PortalLayoutProps {
  role: Role;
  navItems: { id: string; label: string; icon: typeof Cpu }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
  roleLabel: string;
  roleIcon: typeof Cpu;
  roleGradient: string;
}

export function PortalLayout({
  navItems,
  activeTab,
  onTabChange,
  children,
  roleLabel,
  roleIcon: RoleIcon,
  roleGradient,
}: PortalLayoutProps) {
  const { currentUser, logout } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden relative p-1">
              <Image 
                src={logoImage} 
                alt="Logo" 
                fill 
                className="object-contain p-1" 
                priority
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight text-slate-900">Techno Kids Kafr Abdo</p>
              <p className="text-xs text-slate-500">{roleLabel} Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <Avatar className="h-8 w-8 border border-slate-200">
                <AvatarImage src={currentUser?.avatar_url || undefined} alt={currentUser?.name} />
                <AvatarFallback className="bg-slate-200 text-xs font-semibold">
                  {currentUser?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight text-slate-900">{currentUser?.name}</p>
                <p className="text-xs text-slate-500">{currentUser?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-slate-600 hover:text-slate-900">
              <LogOut className="mr-1.5 h-4 w-4" />
              Switch Role
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-slate-200 bg-white/50 p-4 md:flex">
          {/* Role badge */}
          <div className={`mb-6 flex items-center gap-3 rounded-xl bg-gradient-to-r ${roleGradient} p-3 text-white shadow-sm`}>
            <RoleIcon className="h-5 w-5 shrink-0" />
            <span className="text-sm font-semibold">{roleLabel}</span>
          </div>

          {/* Nav items */}
          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User card at bottom */}
          <div className="mt-auto rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 border border-slate-200">
                <AvatarImage src={currentUser?.avatar_url || undefined} alt={currentUser?.name} />
                <AvatarFallback className="bg-slate-200 text-xs font-semibold">
                  {currentUser?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900">{currentUser?.name}</p>
                <p className="truncate text-xs text-slate-500">{currentUser?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white/90 px-2 py-2 backdrop-blur-md md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <main className="min-h-[calc(100vh-4rem)] flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}