import { Suspense } from 'react';
import SignupForm from '@/components/auth/SignupForm';
import PublicLandingLayout from '@/components/landing/PublicLandingLayout';
import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Sign Up',
  description: 'Create an account to join your local neighborhood discussions.',
});

export default function SignupPage() {
  return (
    <PublicLandingLayout>
      <Suspense fallback={
        <div className="w-full flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <SignupForm />
      </Suspense>
    </PublicLandingLayout>
  );
}
