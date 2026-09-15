'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, User } from 'lucide-react';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // Query Supabase portal_users table using your exact schema
    const { data, error } = await supabase
      .from('portal_users')
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

    // Save user session to localStorage so context picks it up instantly
    localStorage.setItem('currentUser', JSON.stringify(data));

    toast({
      title: 'Welcome Back!',
      description: `Logged in as ${data.name}`,
    });

    // Soft-reload or let context update to render the correct portal via AppContent
    window.location.reload();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Techno Kids Kafr Abdo</CardTitle>
          <CardDescription>Enter your portal username and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="e.g. Noha"
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}