'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User, LogIn, Aperture } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { photographerApi } from '@/lib/photographer-api';

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
    <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-6"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6 w-20 h-20 bg-gradient-to-br from-[#ff9d7e] to-[#f5826b] rounded-2xl flex items-center justify-center shadow-xl">
            <Aperture className="w-10 h-10 text-white" />
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
              Photographer Login
            </h2>
            <p className="font-nunito text-sm text-[#9a9286]">
              Upload photos directly to AWS S3
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
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 font-nunito bg-[#f7f6f3] border-[#e5e1d7] focus:border-[#ff9d7e] focus:ring-[#ff9d7e]/20"
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
                  className="pl-10 pr-10 h-12 font-nunito bg-[#f7f6f3] border-[#e5e1d7] focus:border-[#ff9d7e] focus:ring-[#ff9d7e]/20"
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
              className="w-full h-12 bg-gradient-to-r from-[#ff9d7e] to-[#f5826b] hover:from-[#f5826b] hover:to-[#eb6f59] text-white font-jakarta font-semibold text-base transition-all hover:shadow-lg disabled:opacity-50"
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

          <div className="mt-6 p-4 bg-[#f7f6f3] rounded-lg border border-[#e5e1d7]">
            <p className="font-nunito text-xs text-[#9a9286] text-center mb-2">
              Use your seeded photographer account
            </p>
            <p className="font-mono text-xs text-[#1f1b16] text-center">
              Example: <span className="font-semibold">team2b</span> / password123
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
