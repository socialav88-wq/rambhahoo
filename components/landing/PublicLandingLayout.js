import Link from 'next/link';
import { Flame } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function PublicLandingLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Navigation Bar */}
      <nav className="fixed w-full bg-white z-50 px-6 py-4 flex justify-between items-center shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00D1A1] rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-[#00D1A1] tracking-tight">Rambhahoo</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/about" className="text-sm font-semibold text-gray-700 hover:text-[#00D1A1] hidden md:block transition-colors">About Us</Link>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline" className="px-6 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="px-6 rounded-full bg-[#00D1A1] hover:bg-[#00B88D] text-white border-none shadow-sm transition-colors">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Split */}
      <main className="flex-1 flex flex-col md:flex-row mt-[72px]">
        {/* Left Side - Gradient Area */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-[#00D1A1] to-[#00A07A] flex-col items-center justify-center text-white p-12 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-white blur-[120px] mix-blend-overlay"></div>
          </div>
          
          <div className="max-w-md text-center relative z-10">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md shadow-xl border border-white/30">
                <Flame className="w-12 h-12 text-white drop-shadow-md" />
              </div>
            </div>
            <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
              Connect with your community.
            </h1>
            <p className="text-xl opacity-90 leading-relaxed font-medium">
              Join Rambhahoo to share, discover, and build genuine relationships with the people around you.
            </p>
          </div>
        </div>

        {/* Right Side - Auth Form (Centered vertically) */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 py-12 md:max-w-xl mx-auto md:mx-0 bg-white shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)] z-10 md:rounded-l-[40px] md:-ml-[40px]">
          <div className="w-full max-w-[400px] mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome</h2>
            <p className="text-gray-500 mb-8">Please enter your details to continue.</p>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
