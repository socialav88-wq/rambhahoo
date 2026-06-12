import Navbar from './Navbar';
import BottomNav from './BottomNav';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import ToastContainer from '@/components/ui/Toast';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex gap-6">
          <LeftSidebar />
          <main className="flex-1 min-w-0 pb-20 md:pb-4">
            {children}
          </main>
          <RightSidebar />
        </div>
      </div>
      <BottomNav />
      <ToastContainer />
      <PWAInstallPrompt />
    </div>
  );
}
