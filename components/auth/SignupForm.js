'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Flame } from 'lucide-react';
import Button from '@/components/ui/Button';
import { signup, loginWithGoogleToken } from '@/app/actions/auth';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function SignupFormInner() {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
          text="signup_with"
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

export default function SignupForm() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1062049930567-jafpc7pgqhpvtssbe295sm1m2ncho03p.apps.googleusercontent.com";
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <SignupFormInner />
    </GoogleOAuthProvider>
  );
}
