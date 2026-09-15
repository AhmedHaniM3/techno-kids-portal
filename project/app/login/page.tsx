'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u && u.role) {
          router.push('/dashboard');
        }
      } catch (e) {}
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .ilike('username', cleanUsername)
      .eq('password', cleanPassword)
      .maybeSingle();

    if (error || !data) {
      toast({
        title: 'Login Failed',
        description: error ? `Error: ${error.message}` : 'Incorrect username or password.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    localStorage.setItem('currentUser', JSON.stringify(data));

    toast({
      title: 'Welcome Back!',
      description: `Logged in as ${data.name || data.username}`,
    });

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <Card className="w-full max-w-md border-slate-200 shadow-xl overflow-hidden">
        {/* Extra tall, prominent banner container for a massive logo */}
        <div className="bg-slate-100 py-10 px-6 flex items-center justify-center border-b border-slate-200">
          <img 
            src="/logo.png" 
            alt="Techno Kids Logo" 
            className="h-44 w-full object-contain drop-shadow-md" 
          />
        </div>

        <CardHeader className="space-y-1 text-center pt-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Portal Login</CardTitle>
          <CardDescription>Enter your username and password</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="e.g. Mariam"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}