import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-primary border-t border-border mt-auto w-full pt-10 pb-6 px-4 md:px-8 z-10 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 hide-in-pwa">
        <div className="col-span-1 sm:col-span-2 md:col-span-1">
          <h2 className="text-xl font-bold font-[family-name:var(--font-poppins)] text-text-primary mb-4">Rambhahoo</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Hyderabad's premier local social network. Discover, discuss, and connect with your neighborhood in real-time.
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wider">Explore</h3>
          <nav aria-label="Explore navigation">
            <ul className="space-y-3 text-sm text-text-muted">
              <li><Link href="/trending" className="hover:text-blue-primary transition-colors">Trending Discussions</Link></li>
              <li><Link href="/search" className="hover:text-blue-primary transition-colors">Search Communities</Link></li>
              <li><Link href="/create-locality" className="hover:text-blue-primary transition-colors">Request a Locality</Link></li>
            </ul>
          </nav>
        </div>

        <div>
          <h3 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wider">About</h3>
          <nav aria-label="About navigation">
            <ul className="space-y-3 text-sm text-text-muted">
              <li><Link href="/about" className="hover:text-blue-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-blue-primary transition-colors">Contact Support</Link></li>
              <li><Link href="/help" className="hover:text-blue-primary transition-colors">Help Center</Link></li>
            </ul>
          </nav>
        </div>

        <div>
          <h3 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wider">Legal</h3>
          <nav aria-label="Legal navigation">
            <ul className="space-y-3 text-sm text-text-muted">
              <li><Link href="/privacy" className="hover:text-blue-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-blue-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/guidelines" className="hover:text-blue-primary transition-colors">Community Guidelines</Link></li>
            </ul>
          </nav>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between text-xs text-text-dim">
        <p>© {currentYear} Rambhahoo. All rights reserved.</p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <a href="https://twitter.com/rambhahoo" target="_blank" rel="noopener noreferrer" className="hover:text-blue-primary transition-colors">Twitter</a>
          <a href="https://instagram.com/rambhahoo" target="_blank" rel="noopener noreferrer" className="hover:text-blue-primary transition-colors">Instagram</a>
          <a href="https://linkedin.com/company/rambhahoo" target="_blank" rel="noopener noreferrer" className="hover:text-blue-primary transition-colors">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}
