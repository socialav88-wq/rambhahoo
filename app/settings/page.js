'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import SettingsPanels from '@/components/settings/SettingsPanels';
import { Sliders } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [userMetadata, setUserMetadata] = useState({});
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Auth protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load Supabase user metadata
  useEffect(() => {
    async function loadUserMetadata() {
      if (!user) return;
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.user_metadata) {
          setUserMetadata(authUser.user_metadata);
        }
      } catch (err) {
        console.warn('Failed to load settings metadata:', err.message);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadUserMetadata();
  }, [user]);

  // Persist metadata to Supabase auth details
  const handleSaveMetadata = async (updatedData) => {
    try {
      const supabase = createClient();
      const mergedMeta = {
        ...userMetadata,
        ...updatedData
      };
      
      // Update local state immediately for responsive feedback
      setUserMetadata(mergedMeta);
      
      const { error } = await supabase.auth.updateUser({
        data: mergedMeta
      });
      
      if (error) throw error;
    } catch (err) {
      toast.error('Settings backup failed: ' + err.message);
    }
  };

  if (authLoading || loadingMeta) {
    return (
      <div className="max-w-5xl mx-auto py-6 px-4 animate-pulse">
        <div className="h-8 bg-bg-card rounded-lg w-48 mb-6" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 h-80 bg-bg-card rounded-2xl shrink-0" />
          <div className="flex-1 h-96 bg-bg-card rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="max-w-5xl mx-auto py-4 md:py-6 px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="p-2 bg-blue-primary/10 text-blue-primary rounded-xl">
          <Sliders size={22} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-poppins)] text-text-primary tracking-tight">
            Settings & Customization
          </h1>
          <p className="text-xs text-text-dim mt-0.5">Manage your preferences, location metrics, and account details</p>
        </div>
      </div>

      {/* Settings Grid Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar Nav */}
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Main Content Panels */}
        <div className="flex-1 w-full min-w-0">
          <SettingsPanels 
            activeTab={activeTab} 
            userMetadata={userMetadata} 
            onSaveMetadata={handleSaveMetadata} 
          />
        </div>
      </div>
    </div>
  );
}
