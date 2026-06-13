import LoginForm from '@/components/auth/LoginForm';
import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Log In',
  description: 'Log in to Rambhahoo to connect with your neighborhood.',
  noindex: true,
});

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-fade-in">
      <LoginForm />
    </div>
  );
}
