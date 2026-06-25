'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User, LogIn, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api-client';
import { authApi } from '@/lib/auth-api';
import { DemoAccounts } from '@/lib/kiosk-api';
import { DemoCredentials } from '@/components/demo-credentials';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccounts | null>(null);

  useEffect(() => {
    authApi
      .getDemoAccounts()
      .then((response) => setDemoAccounts(response.data ?? null))
      .catch(() => setDemoAccounts(null));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/v1/auth/login', {
        email,
        password,
      });

      if (response.data) {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password');
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
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6 w-20 h-20 bg-gradient-to-br from-[#6fcf97] to-[#56b881] rounded-2xl flex items-center justify-center shadow-xl">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-jakarta text-3xl font-bold text-[#1f1b16] mb-2">
            Face Craft Studio
          </h1>
          <p className="font-nunito text-[#9a9286] text-center">
            Where Technology Meets Tradition
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 border border-[#e5e1d7]"
        >
          <div className="mb-6 text-center">
            <h2 className="font-jakarta text-2xl font-bold text-[#1f1b16] mb-2">
              Admin Login
            </h2>
            <p className="font-nunito text-sm text-[#9a9286]">
              Manage your photo kiosk operations
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-[#f7e8e8] border border-[#e8bfbf] text-[#a32d2d] px-4 py-3 rounded-lg font-nunito text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="font-nunito text-sm font-medium text-[#1f1b16] block">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9a9286]" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 font-nunito bg-[#f7f6f3] border-[#e5e1d7] focus:border-[#6fcf97] focus:ring-[#6fcf97]/20"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
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
                  className="pl-10 pr-10 h-12 font-nunito bg-[#f7f6f3] border-[#e5e1d7] focus:border-[#6fcf97] focus:ring-[#6fcf97]/20"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9286] hover:text-[#1f1b16] transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#6fcf97] to-[#56b881] hover:from-[#56b881] hover:to-[#45a56f] text-white font-jakarta font-semibold text-base transition-all hover:shadow-lg disabled:opacity-50"
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

          <DemoCredentials accounts={demoAccounts} variant="admin" />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="font-nunito text-sm text-[#9a9286]">
            Need help? Contact system administrator
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
