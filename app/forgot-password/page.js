'use client';

import Link from 'next/link';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-bg-card border border-border rounded-2xl shadow-md text-center">
      <div className="w-16 h-16 bg-blue-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-primary">
        <Mail size={32} />
      </div>
      
      <h1 className="text-2xl font-bold text-text-primary mb-2 font-[family-name:var(--font-poppins)]">
        Forgot Password?
      </h1>
      
      <p className="text-text-muted text-sm mb-6 leading-relaxed">
        Password recovery is simple! Please sign in using your **Google account** (it does not require a password) or contact support at **support@rambhahoo.com** to reset your credentials.
      </p>

      <div className="p-4 bg-accent-amber/5 border border-accent-amber/20 rounded-xl flex items-start gap-3 text-left mb-6">
        <AlertCircle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
        <p className="text-xs text-accent-amber font-medium leading-normal">
          If you originally registered with Google, you can click "Continue with Google" on the login page to sign back in instantly.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/login" className="w-full">
          <button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-full py-3 text-sm font-semibold transition-colors shadow-sm cursor-pointer">
            Back to Login
          </button>
        </Link>
      </div>

      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary mt-6 hover:underline transition-all">
        <ArrowLeft size={12} />
        <span>Back to Home</span>
      </Link>
    </div>
  );
}
