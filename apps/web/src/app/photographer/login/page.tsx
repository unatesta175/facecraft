'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { photographerApi } from '@/lib/photographer-api';
import { LoginBackButton } from '@/components/login-back-button';
import { LoginBrandHeader } from '@/components/login-brand-header';

export default function PhotographerLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await photographerApi.login(username, password);

      if (!response.data?.user?.isPhotographer && response.data?.user?.role !== 'ADMIN') {
        toast({
          title: 'Access denied',
          description: 'This account is not a photographer',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Login successful! Redirecting...',
      });

      router.push('/photographer');
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <LoginBackButton className="hover:bg-[--color-surface-muted]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-6"
      >
        <LoginBrandHeader />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 border border-[--color-border]"
        >
          <div className="mb-6 text-center">
            <h2 className="font-jakarta text-2xl font-bold text-[--color-text-primary] mb-2">
              Photographer Login
            </h2>
            <p className="font-nunito text-sm text-[--color-text-secondary]">
              Upload and manage customer photos
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="font-nunito text-sm font-medium text-[--color-text-primary] block">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[--color-text-secondary]" />
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 font-nunito bg-[--color-surface-muted] border-[--color-border] focus:border-[--color-gold] focus:ring-[--color-gold]/20"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-nunito text-sm font-medium text-[--color-text-primary] block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[--color-text-secondary]" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 font-nunito bg-[--color-surface-muted] border-[--color-border] focus:border-[--color-gold] focus:ring-[--color-gold]/20"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[--color-gold] hover:bg-[--color-gold-hover] text-white font-jakarta font-semibold text-base transition-all hover:shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-[--color-surface-muted] rounded-lg border border-[--color-border]">
            <p className="font-nunito text-xs text-[--color-text-secondary] text-center mb-2">
              Use your photographer account
            </p>
            <p className="font-mono text-xs text-[--color-text-primary] text-center">
              Example: <span className="font-semibold">team2b</span> / password123
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
