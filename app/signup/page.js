import SignupForm from '@/components/auth/SignupForm';
import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Sign Up',
  description: 'Create an account to join your local neighborhood discussions.',
  noindex: true,
});

export default function SignupPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-fade-in">
      <SignupForm />
    </div>
  );
}
