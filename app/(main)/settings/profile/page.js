'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, User, Type, AlignLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { updateProfile } from '@/app/actions/profile';

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);
  
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        displayName: user.profile.display_name || '',
        username: user.profile.username || '',
        bio: user.profile.bio || ''
      });
      setAvatarPreview(user.profile.avatar_url || '');
    }
  }, [user]);

  if (!user) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    startTransition(async () => {
      const data = new FormData();
      data.append('displayName', formData.displayName);
      data.append('username', formData.username);
      data.append('bio', formData.bio);
      if (avatarFile) data.append('avatar', avatarFile);

      const result = await updateProfile(data);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Profile updated successfully!');
        // Refresh session to get new profile data
        const res = await fetch('/api/auth/session');
        const sessionData = await res.json();
        if (sessionData.user) {
          useAuthStore.getState().setUser(sessionData.user);
        }
        setTimeout(() => router.push('/profile'), 1000);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-0 animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Edit Profile</h1>
      
      <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center sm:items-start gap-4 pb-6 border-b border-border-light">
            <h3 className="text-sm font-semibold text-text-primary w-full text-center sm:text-left">Profile Photo</h3>
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar 
                  src={avatarPreview} 
                  name={formData.displayName || formData.username} 
                  size="xl" 
                  className="w-24 h-24 border-4 border-bg-elevated transition-transform group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Change Photo
                </Button>
                <p className="text-xs text-text-dim mt-2">JPG, GIF or PNG. Max size 2MB.</p>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange}
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Display Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-text-dim" />
                </div>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={e => setFormData({...formData, displayName: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 bg-bg-elevated border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-primary/50 transition-shadow"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Username <span className="text-accent-red">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Type size={16} className="text-text-dim" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()})}
                  className="w-full pl-10 pr-3 py-2 bg-bg-elevated border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-primary/50 transition-shadow"
                  placeholder="username"
                />
              </div>
              <p className="text-xs text-text-dim mt-1">Letters, numbers, and underscores only. This is your unique URL.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Bio</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <AlignLeft size={16} className="text-text-dim" />
                </div>
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  rows={4}
                  className="w-full pl-10 pr-3 py-2 bg-bg-elevated border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-primary/50 transition-shadow resize-none"
                  placeholder="Tell people a little bit about yourself..."
                />
              </div>
            </div>
          </div>

          {/* Feedback */}
          {error && <p className="text-sm text-accent-red font-medium bg-accent-red/10 p-3 rounded-xl">{error}</p>}
          {success && <p className="text-sm text-accent-green font-medium bg-accent-green/10 p-3 rounded-xl">{success}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isPending} className="min-w-[120px]">
              {isPending ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Save Changes'}
            </Button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
