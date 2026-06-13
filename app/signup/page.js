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
      <SignupForm />
    </PublicLandingLayout>
  );
}
