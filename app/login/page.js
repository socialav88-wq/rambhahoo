import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import PublicLandingLayout from '@/components/landing/PublicLandingLayout';
import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Log In',
  description: 'Log in to Rambhahoo to connect with your neighborhood.',
});

export default function LoginPage() {
  return (
    <PublicLandingLayout>
      <Suspense fallback={
        <div className="w-full flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </PublicLandingLayout>
  );
}
