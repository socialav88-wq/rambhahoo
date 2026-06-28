import Navbar from './Navbar';
import BottomNav from './BottomNav';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import ToastContainer from '@/components/ui/Toast';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';
import Footer from './Footer';
import { Suspense } from 'react';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Navbar />
      <div className="mx-auto max-w-[1440px] px-4 py-4 flex-1 w-full">
        <div className="flex gap-6">
          <Suspense fallback={<div className="hidden lg:block w-64 shrink-0" />}>
            <LeftSidebar />
          </Suspense>
          <main className="flex-1 min-w-0 pb-20 md:pb-4">
            {children}
          </main>
          <RightSidebar />
        </div>
      </div>
      <Footer />
      <BottomNav />
      <ToastContainer />
      <PWAInstallPrompt />
    </div>
  );
}
