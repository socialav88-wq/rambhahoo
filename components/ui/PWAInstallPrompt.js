'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import Button from './Button';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    // Check if already dismissed
    if (typeof window !== 'undefined' && localStorage.getItem('pwa-dismissed')) {
      return;
    }
    
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a delay to not interrupt initial experience
      setTimeout(() => setShowPrompt(true), 5000);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };
  
  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-dismissed', 'true');
  };
  
  if (!showPrompt || dismissed) return null;
  
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-80 z-50 animate-slide-up">
      <div className="bg-white border border-border rounded-2xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-primary to-purple-secondary shadow-sm">
            <Download size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary text-sm">Install Rambhahoo</h3>
            <p className="text-xs text-text-muted mt-1">Get the full app experience on your phone!</p>
          </div>
          <button onClick={handleDismiss} className="text-text-dim hover:text-text-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={handleInstall} size="sm" className="flex-1">
            Install App
          </Button>
          <Button onClick={handleDismiss} variant="ghost" size="sm">
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
