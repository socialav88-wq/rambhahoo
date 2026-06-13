import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Settings',
  description: 'Manage your Rambhahoo account settings.',
  noindex: true,
});

export default function SettingsLayout({ children }) {
  return <>{children}</>;
}
