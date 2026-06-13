import Link from 'next/link';
import Image from 'next/image';
import { Flame } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function PublicLandingLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col font-[family-name:var(--font-inter)]">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white z-50 flex items-center justify-between px-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D1A1] to-[#00A880] flex items-center justify-center shadow-sm">
              <Flame size={18} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-[#00D1A1] font-[family-name:var(--font-poppins)]">
              Rambhahoo
            </span>
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Link href="/about" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            Partners
          </Link>
          <Link href="/about" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            Businesses
          </Link>
          <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            Log in
          </Link>
          <Link href="/signup">
            <button className="bg-[#00D1A1] hover:bg-[#00B88D] text-white px-5 py-2 rounded-full text-sm font-bold transition-colors">
              Sign up
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 mt-16 flex flex-col">
        <div className="relative w-full overflow-hidden" style={{ minHeight: 'calc(100vh - 64px)' }}>
          {/* Background Image Container */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/landing_hero.png"
              alt="Neighborhood park"
              className="w-full h-full object-cover object-top"
            />
            {/* White fade at bottom of hero to blend into content */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          </div>

          {/* Foreground Auth Card */}
          <div className="relative z-10 w-full flex items-start justify-center pt-16 md:pt-24 px-4 pb-20">
            <div className="w-full max-w-md bg-white rounded-[24px] shadow-2xl p-8 md:p-10 text-center animate-fade-in-up">
              <h1 className="text-[26px] md:text-3xl font-semibold text-[#1A4B71] mb-8 font-[family-name:var(--font-poppins)] tracking-tight">
                Discover your neighborhood
              </h1>
              
              {children}
              
            </div>
          </div>
        </div>

        {/* Marketing Features Section */}
        <div className="w-full bg-white relative z-20 py-20 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white transform hover:-translate-y-1 transition-transform duration-300">
              <div className="relative h-[320px] w-full">
                <img src="/images/landing_card_verification.png" alt="Secure environment" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                  <p className="text-white font-medium leading-relaxed drop-shadow-md text-[17px]">
                    A secure environment where neighbors <span className="font-bold">verify</span> their address to join.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white transform hover:-translate-y-1 transition-transform duration-300">
              <div className="relative h-[320px] w-full">
                <img src="/images/landing_card_alerts.png" alt="Local alerts" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                  <p className="text-white font-medium leading-relaxed drop-shadow-md text-[17px]">
                    Stay informed with <span className="font-bold">alerts</span> and <span className="font-bold">local news</span> from trusted sources.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white transform hover:-translate-y-1 transition-transform duration-300">
              <div className="relative h-[320px] w-full">
                <img src="/images/landing_card_favorites.png" alt="Local favorites" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                  <p className="text-white font-medium leading-relaxed drop-shadow-md text-[17px]">
                    Discover <span className="font-bold">local favorites</span> recommended by neighbors.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="w-full bg-white pb-24 text-center px-4">
          <h2 className="text-3xl font-semibold text-[#1A4B71] mb-6 tracking-tight">
            Connect with your neighbors
          </h2>
          <Link href="/signup">
            <button className="bg-[#00D1A1] hover:bg-[#00B88D] text-white px-8 py-3.5 rounded-full text-lg font-bold transition-colors shadow-lg hover:shadow-xl">
              Join Rambhahoo
            </button>
          </Link>
        </div>
        
      </main>
    </div>
  );
}
