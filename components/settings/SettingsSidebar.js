'use client';

import { 
  User, Lock, Bell, Palette, MapPin, 
  Bookmark, ShieldAlert, Sliders, HelpCircle, Info 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const SETTINGS_TABS = [
  { id: 'profile', label: 'Edit Profile', desc: 'Manage display name, bio, and avatar', icon: User },
  { id: 'privacy', label: 'Privacy', desc: 'Visibility, online status, blocked & muted users', icon: Lock },
  { id: 'notifications', label: 'Notifications', desc: 'Customize likes, comments, and email alerts', icon: Bell },
  { id: 'appearance', label: 'Appearance', desc: 'Theme, animations, font sizes, and layout', icon: Palette },
  { id: 'location', label: 'Location Preferences', desc: 'City, neighborhood, and search radius limits', icon: MapPin },
  { id: 'saved', label: 'Saved Content', desc: 'View saved posts, advice, and communities', icon: Bookmark },
  { id: 'security', label: 'Security', desc: 'Active login sessions, 2FA, and delete account', icon: ShieldAlert },
  { id: 'app', label: 'App Settings', desc: 'Clear cache, storage statistics, and data saver', icon: Sliders },
  { id: 'help', label: 'Help & Support', desc: 'FAQs, report bug forms, and customer support', icon: HelpCircle },
  { id: 'about', label: 'About', desc: 'Rambhahoo build versions, policies, and guidelines', icon: Info }
];

export default function SettingsSidebar({ activeTab, setActiveTab }) {
  return (
    <div>
      {/* Mobile Horizontal Navigation Tabs */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar snap-x scroll-smooth border-b border-border mb-4">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shrink-0 snap-start border transition-all cursor-pointer",
                isActive 
                  ? "bg-blue-primary text-white border-blue-primary shadow-sm"
                  : "bg-bg-elevated text-text-muted border-border hover:border-text-dim hover:text-text-primary"
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Vertical Sidebar */}
      <div className="hidden md:flex flex-col gap-1.5 w-64 shrink-0 bg-bg-card border border-border rounded-2xl p-4 shadow-sm h-fit">
        <h2 className="text-xs font-bold text-text-dim uppercase tracking-wider px-3 mb-2">
          Settings Categories
        </h2>
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-start gap-3 w-full px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer border group",
                isActive
                  ? "bg-blue-primary border-blue-primary text-white shadow-md shadow-blue-primary/10"
                  : "bg-transparent border-transparent text-text-primary hover:bg-bg-elevated hover:border-border"
              )}
            >
              <Icon 
                size={18} 
                className={cn(
                  "mt-0.5 shrink-0 transition-colors",
                  isActive ? "text-white" : "text-text-muted group-hover:text-blue-primary"
                )} 
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate leading-none">
                  {tab.label}
                </p>
                <p 
                  className={cn(
                    "text-[10px] mt-1 truncate leading-none transition-colors",
                    isActive ? "text-blue-100" : "text-text-dim"
                  )}
                >
                  {tab.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
