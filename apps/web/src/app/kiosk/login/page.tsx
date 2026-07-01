'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, LogIn, User } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { kioskApi, DemoAccounts } from '@/lib/kiosk-api';
import { DemoCredentials } from '@/components/demo-credentials';
import { BrandLogo } from '@/components/brand-logo';
import { KioskShell } from '@/components/kiosk/kiosk-shell';
import { kioskBtnPrimary, kioskCard, kioskInput } from '@/lib/kiosk-ui';

export default function KioskLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccounts | null>(null);

  useEffect(() => {
    kioskApi
      .getDemoAccounts()
      .then((response) => setDemoAccounts(response.data ?? null))
      .catch(() => {
        setDemoAccounts(null);
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await kioskApi.login(username, password);

      if (!response.data?.kiosk) {
        throw new Error('Login failed');
      }

      kioskApi.saveSession(response.data.kiosk);

      toast({
        title: 'Success',
        description: `Welcome, ${response.data.kiosk.name}`,
      });

      router.push('/kiosk/home');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error?.message || 'Invalid username or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KioskShell fixed className="bg-white">
      <div className="flex shrink-0 items-center px-4 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 font-nunito text-sm text-[--color-text-secondary] hover:bg-[--color-surface-muted] hover:text-[--color-text-primary]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pb-5 pt-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex shrink-0 justify-center"
        >
          <BrandLogo
            centered
            className="justify-center"
            imageClassName="h-24 w-auto max-w-[min(100%,260px)] object-contain mx-auto"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`${kioskCard} shrink-0 p-6 shadow-md`}
        >
          <div className="mb-5 text-center">
            <h2 className="font-jakarta text-xl font-bold text-[--color-text-primary]">
              Kiosk Login
            </h2>
            <p className="mt-1 font-nunito text-sm text-[--color-text-secondary]">
              Sign in with your kiosk account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-nunito text-sm font-medium text-[--color-text-primary]">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[--color-text-secondary]" />
                <Input
                  type="text"
                  placeholder="Enter kiosk username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`pl-10 ${kioskInput}`}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-nunito text-sm font-medium text-[--color-text-primary]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[--color-text-secondary]" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-10 ${kioskInput}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-secondary]"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className={`h-14 w-full rounded-2xl text-base ${kioskBtnPrimary}`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Sign In
                </span>
              )}
            </Button>
          </form>

          <DemoCredentials
            accounts={demoAccounts}
            variant="kiosk"
            onApply={({ login, password }) => {
              setUsername(login);
              setPassword(password);
            }}
          />
        </motion.div>

        <p className="shrink-0 text-center font-nunito text-xs text-[--color-text-secondary]">
          Need help? Contact your supervisor
        </p>
      </div>
    </KioskShell>
  );
}
