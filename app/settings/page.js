'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { updateProfile } from '@/app/actions/profile';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { User, Image as ImageIcon, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setAvatarPreview(profile.avatar_url || '');
    }
  }, [profile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('displayName', displayName);
    formData.append('bio', bio);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    
    const result = await updateProfile(formData);

    if (result?.error) {
      alert(result.error);
    } else {
      // Refresh profile in store after update
      try {
        const supabase = createClient();
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (updatedProfile) {
          useAuthStore.getState().setProfile(updatedProfile);
        }
      } catch (refreshErr) {
        console.warn('Could not refresh profile after update:', refreshErr.message);
      }
      alert('Profile updated successfully!');
      router.push(`/profile/${profile.username}`);
    }
    setIsSubmitting(false);
  };

  if (!user || !profile) return null;

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="bg-bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <User className="text-blue-primary" size={24} />
          <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] text-text-primary">
            Edit Profile
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
            <div className="relative group">
              <Avatar src={avatarPreview} name={displayName || profile.username} size="lg" className="w-24 h-24 text-3xl" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={24} />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-medium text-text-primary mb-1">Profile Picture</h3>
              <p className="text-sm text-text-dim mb-3">JPG, GIF or PNG. 2MB max.</p>
              <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-elevated hover:bg-border border border-border rounded-lg text-sm font-medium cursor-pointer transition-colors">
                <ImageIcon size={16} />
                Upload New Image
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Username (Read-only)
              </label>
              <input
                type="text"
                value={profile.username}
                disabled
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-muted opacity-70 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Tell the community a little about yourself..."
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/50 transition-all resize-none"
              />
              <div className="text-right text-xs text-text-dim mt-1">
                {bio.length}/160
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
