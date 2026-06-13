import { Inter, Poppins } from "next/font/google";
import MainLayout from "@/components/layout/MainLayout";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import AuthProvider from "@/components/providers/AuthProvider";
import RealtimeProvider from "@/components/providers/RealtimeProvider";
import { Toaster } from "react-hot-toast";
import { generateMetadata } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = generateMetadata({});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#F8FAFC" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
      </head>
      <body className={`${inter.variable} ${poppins.variable} antialiased min-h-screen flex flex-col`}>
        <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              borderRadius: '16px',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              fontWeight: 500,
              padding: '12px 20px',
            },
            className: 'animate-bounce-in',
          }} 
        />
        <AuthProvider>
          <RealtimeProvider>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify([
                  {
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: 'Rambhahoo',
                    description: 'Hyderabad\'s hyperlocal social network',
                    url: 'https://www.rambhahoo.com',
                    potentialAction: {
                      '@type': 'SearchAction',
                      target: 'https://www.rambhahoo.com/search?q={search_term_string}',
                      'query-input': 'required name=search_term_string',
                    },
                  },
                  {
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    name: 'Rambhahoo',
                    url: 'https://www.rambhahoo.com',
                    logo: 'https://www.rambhahoo.com/icon-192x192.png',
                    sameAs: [
                      'https://twitter.com/rambhahoo',
                      'https://instagram.com/rambhahoo',
                      'https://youtube.com/rambhahoo',
                      'https://linkedin.com/company/rambhahoo',
                      'https://facebook.com/rambhahoo'
                    ]
                  }
                ])
              }}
            />
            <LayoutWrapper mainLayout={<MainLayout>{children}</MainLayout>}>
              {children}
            </LayoutWrapper>
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
