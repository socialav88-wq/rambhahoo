import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Create Locality',
  description: 'Request a new neighborhood or locality on Rambhahoo.',
  noindex: true,
});

export default function CreateLocalityLayout({ children }) {
  return <>{children}</>;
}
