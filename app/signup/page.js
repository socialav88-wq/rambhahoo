import SignupForm from '@/components/auth/SignupForm';
import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Sign Up',
  description: 'Join Rambhahoo and connect with your local community.',
});

export default function SignupPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-fade-in">
      <SignupForm />
    </div>
  );
}
