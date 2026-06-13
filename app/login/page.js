import LoginForm from '@/components/auth/LoginForm';
import PublicLandingLayout from '@/components/landing/PublicLandingLayout';
import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Log In',
  description: 'Log in to Rambhahoo to connect with your neighborhood.',
  noindex: true,
});

export default function LoginPage() {
  return (
    <PublicLandingLayout>
      <LoginForm />
    </PublicLandingLayout>
  );
}
