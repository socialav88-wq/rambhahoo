'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Flame } from 'lucide-react';
import Button from '@/components/ui/Button';
import { signup, loginWithGoogle } from '@/app/actions/auth';

export default function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formDataObj = new FormData();
    formDataObj.append('email', formData.email);
    formDataObj.append('password', formData.password);
    formDataObj.append('username', formData.username);
    formDataObj.append('display_name', formData.username);
    
    const result = await signup(formDataObj);
    
    setIsLoading(false);
    if (result?.error) {
      alert(result.error);
    } else {
      router.push('/');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const result = await loginWithGoogle();
    if (result?.error) {
      alert(result.error);
      setIsLoading(false);
    } else if (result?.url) {
      window.location.href = result.url;
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full">
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-full py-3 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-3"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          <path d="M1 1h22v22H1z" fill="none" />
        </svg>
        Continue with Google
      </button>

      <button
        disabled={true}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-full py-3 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-6"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
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
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username"
            required
            minLength={3}
            className="w-full bg-white border-b border-gray-300 px-2 py-3 text-gray-800 placeholder:text-[#678BA8] focus:outline-none focus:border-[#00D1A1] transition-colors text-[15px]"
          />
        </div>

        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            required
            className="w-full bg-white border-b border-gray-300 px-2 py-3 text-gray-800 placeholder:text-[#678BA8] focus:outline-none focus:border-[#00D1A1] transition-colors text-[15px]"
          />
        </div>

        <div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
            minLength={8}
            className="w-full bg-white border-b border-gray-300 px-2 py-3 text-gray-800 placeholder:text-[#678BA8] focus:outline-none focus:border-[#00D1A1] transition-colors text-[15px]"
          />
        </div>

        <p className="text-[12px] text-[#678BA8] mt-6 mb-6 leading-tight text-center px-4">
          By continuing with sign up, you agree to our <Link href="/privacy" className="text-[#00D1A1] hover:underline">Privacy Policy</Link>, <Link href="/cookie" className="text-[#00D1A1] hover:underline">Cookie Policy</Link>, and <Link href="/terms" className="text-[#00D1A1] hover:underline">Member Agreement</Link>.
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#00D1A1] hover:bg-[#00B88D] text-white rounded-full py-3.5 text-base font-bold transition-colors shadow-sm disabled:opacity-70"
        >
          {isLoading ? 'Creating account...' : 'Continue'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-[#678BA8]">
        Already have an account?{' '}
        <Link href="/login" className="text-[#00D1A1] hover:underline font-medium">
          Log in
        </Link>
      </div>
    </div>
  );
}
