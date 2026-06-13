import { Inter, Poppins } from "next/font/google";
import MainLayout from "@/components/layout/MainLayout";
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
      </head>
      <body className={`${inter.variable} ${poppins.variable} antialiased min-h-screen flex flex-col`}>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '12px',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              fontWeight: 500,
            },
          }} 
        />
        <AuthProvider>
          <RealtimeProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
