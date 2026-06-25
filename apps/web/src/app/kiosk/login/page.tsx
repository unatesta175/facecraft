'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { kioskApi, DemoAccounts } from '@/lib/kiosk-api';
import { DemoCredentials } from '@/components/demo-credentials';

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
      .catch(() => setDemoAccounts(null));
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
    <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-6"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6">
            <svg
              width="80"
              height="80"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" r="48" fill="#1f1b16" />
              <circle cx="50" cy="50" r="40" fill="#d4af37" />
              <circle cx="50" cy="50" r="32" fill="#1f1b16" />
              <path
                d="M35 45 Q50 35 65 45"
                stroke="#d4af37"
                strokeWidth="3"
                fill="none"
              />
              <circle cx="42" cy="48" r="3" fill="#d4af37" />
              <circle cx="58" cy="48" r="3" fill="#d4af37" />
              <path
                d="M40 60 Q50 68 60 60"
                stroke="#d4af37"
                strokeWidth="3"
                fill="none"
              />
            </svg>
          </div>
          <h1 className="font-jakarta text-3xl font-bold text-[#1f1b16] mb-2">
            Face Craft Studio
          </h1>
          <p className="font-nunito text-[#9a9286] text-center">
            Where Technology Meets Tradition
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 border border-[#e5e1d7]"
        >
          <div className="mb-6 text-center">
            <h2 className="font-jakarta text-2xl font-bold text-[#1f1b16] mb-2">
              Kiosk Login
            </h2>
            <p className="font-nunito text-sm text-[#9a9286]">
              Sign in with your kiosk account from the database
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="font-nunito text-sm font-medium text-[#1f1b16] block">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9a9286]" />
                <Input
                  type="text"
                  placeholder="Enter kiosk username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 font-nunito bg-[#f7f6f3] border-[#e5e1d7] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-nunito text-sm font-medium text-[#1f1b16] block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9a9286]" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 font-nunito bg-[#f7f6f3] border-[#e5e1d7] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9286] hover:text-[#1f1b16] transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#d4af37] hover:bg-[#c49d2f] text-[#1f1b16] font-jakarta font-semibold text-base transition-all hover:shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-3 border-[#1f1b16]/30 border-t-[#1f1b16] rounded-full animate-spin" />
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

          <DemoCredentials accounts={demoAccounts} variant="kiosk" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="font-nunito text-sm text-[#9a9286]">
            Need help? Contact your supervisor
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
