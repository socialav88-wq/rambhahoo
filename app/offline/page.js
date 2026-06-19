'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="bg-bg-card border border-border p-8 rounded-3xl max-w-md w-full shadow-lg relative overflow-hidden backdrop-blur-sm">
        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-blue-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-purple-secondary/10 blur-3xl" />

        <div className="w-16 h-16 bg-bg-elevated rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border/50 text-text-dim relative z-10">
          <WifiOff size={32} className="text-text-muted" />
        </div>

        <h1 className="text-2xl font-extrabold text-text-primary font-[family-name:var(--font-poppins)] mb-3 relative z-10">
          You are Offline, Boss!
        </h1>
        
        <p className="text-base font-medium text-blue-primary mb-4 relative z-10 select-none">
          ☕ The tea is hot, but the network is cold.
        </p>

        <p className="text-sm text-text-muted mb-8 leading-relaxed relative z-10">
          Looks like you aren't connected to the internet. Check your connection or mobile data and try again.
        </p>

        <div className="relative z-10 flex flex-col gap-3">
          <Button 
            onClick={handleRetry} 
            variant="primary" 
            className="w-full py-3 font-semibold shadow-md flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </Button>
          <a 
            href="/"
            className="text-xs text-text-dim hover:text-text-muted font-medium py-1 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}
