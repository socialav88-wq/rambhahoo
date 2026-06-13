'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Flame } from 'lucide-react';
import Button from '@/components/ui/Button';
import { login, loginWithGoogleToken } from '@/app/actions/auth';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function LoginFormInner() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    
    const result = await login(formData);
    
    setIsLoading(false);
    if (result?.error) {
      alert(result.error);
    } else {
      router.push('/');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    if (credentialResponse.credential) {
      const result = await loginWithGoogleToken(credentialResponse.credential);
      if (result?.error) {
        alert(result.error);
        setIsLoading(false);
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center mb-3">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            alert('Google Login Failed');
          }}
          useOneTap
          shape="pill"
          size="large"
          width="100%"
          text="continue_with"
        />
      </div>

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
          className="w-full bg-[#00D1A1] hover:bg-[#00B88D] text-white rounded-full py-3.5 text-base font-bold transition-colors shadow-sm disabled:opacity-70 mt-4"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-[#678BA8]">
        Don't have an account?{' '}
        <Link href="/signup" className="text-[#00D1A1] hover:underline font-medium">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function LoginForm() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return <div>Missing Google Client ID</div>;
  }
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoginFormInner />
    </GoogleOAuthProvider>
  );
}
