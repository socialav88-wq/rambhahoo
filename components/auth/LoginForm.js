'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Flame, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }
      
      toast.success('Logged in successfully!');
      router.push('/');
      router.refresh();
    } catch (err) {
      toast.error('Login error: ' + err.message);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }
      if (data?.url) {
        console.log('[AUTH-OAUTH] Redirecting browser to Google OAuth consent screen:', data.url);
        window.location.href = data.url;
      } else {
        console.warn('[AUTH-OAUTH-WARNING] signInWithOAuth resolved without a redirect URL.');
        setIsLoading(false);
      }
    } catch (err) {
      toast.error('Failed to connect to Google: ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {errorParam && (
        <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 text-left">
            <h4 className="text-[14px] font-bold text-red-800 mb-0.5">Authentication Error</h4>
            <p className="text-[13px] text-red-600/90 leading-normal">
              {errorParam === 'auth_callback_failed' 
                ? 'The authentication callback failed. This could be due to a slow network, session timeout, or cookie blocking. Please try again.'
                : errorParam}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-center mb-3">
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-full py-3.5 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm mb-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
            <path
              fill="#EA4335"
              d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3A11.973 11.973 0 0 0 12 0C7.03 0 2.757 2.87 0 7.067l5.266 2.698z"
            />
            <path
              fill="#34A853"
              d="M16.04 15.345c-1.127.755-2.545 1.205-4.04 1.205a7.076 7.076 0 0 1-6.734-4.855L0 14.393A11.983 11.983 0 0 0 12 24c3.486 0 6.64-1.2 9.082-3.268l-5.042-5.387z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.275c0-.825-.075-1.62-.215-2.39H12v4.51h6.46A5.523 5.523 0 0 1 16.04 15.345l5.042 5.387c2.946-2.716 4.408-6.712 4.408-11.457z"
            />
            <path
              fill="#FBBC05"
              d="M5.266 9.765A7.049 7.049 0 0 1 5.266 14.23L0 16.928a11.942 11.942 0 0 0 0-9.86l5.266 2.697z"
            />
          </svg>
          Continue with Google
        </button>
      </div>

      <button
        disabled={true}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-full py-3 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-6"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
        Continue with Facebook
      </button>

      <div className="flex items-center justify-center mb-6">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="px-4 text-[13px] text-[#A6C3DA] font-medium">or</span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full bg-white border-b border-gray-300 px-2 py-3 text-gray-800 placeholder:text-[#678BA8] focus:outline-none focus:border-[#00D1A1] transition-colors text-[15px]"
          />
        </div>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full bg-white border-b border-gray-300 px-2 py-3 text-gray-800 placeholder:text-[#678BA8] focus:outline-none focus:border-[#00D1A1] transition-colors text-[15px]"
          />
        </div>

        <div className="flex justify-end pt-1">
          <Link href="/forgot-password" className="text-[13px] text-[#00D1A1] hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-full py-3.5 text-base font-bold transition-colors shadow-sm disabled:opacity-70 mt-4"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link href="/signup" className="text-[#4F46E5] hover:underline font-medium">
          Sign up
        </Link>
      </div>

      <div className="mt-6 text-center hide-in-pwa">
        <Link href="/" className="text-sm font-medium text-text-muted hover:text-text-primary hover:underline transition-colors">
          Explore without login &rarr;
        </Link>
      </div>
    </div>
  );
}
