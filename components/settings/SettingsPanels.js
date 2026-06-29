'use client';

import { useState, useEffect } from 'react';
import { 
  User, Lock, Bell, Palette, MapPin, 
  Bookmark, ShieldAlert, Sliders, HelpCircle, Info,
  Check, Trash2, Eye, EyeOff, Shield, RefreshCw, 
  Download, Trash, CheckCircle2, AlertTriangle, HelpCircle as HelpIcon,
  ChevronDown, ChevronUp, UserMinus
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export default function SettingsPanels({ activeTab, userMetadata, onSaveMetadata }) {
  const { user, profile } = useAuthStore();
  const settings = useSettingsStore();
  
  // Render active panel based on tab ID
  switch (activeTab) {
    case 'profile':
      return <ProfilePanel profile={profile} user={user} />;
    case 'privacy':
      return <PrivacyPanel userMetadata={userMetadata} onSaveMetadata={onSaveMetadata} />;
    case 'notifications':
      return <NotificationsPanel userMetadata={userMetadata} onSaveMetadata={onSaveMetadata} />;
    case 'appearance':
      return <AppearancePanel settings={settings} />;
    case 'location':
      return <LocationPanel settings={settings} profile={profile} user={user} />;
    case 'saved':
      return <SavedPanel user={user} userMetadata={userMetadata} onSaveMetadata={onSaveMetadata} />;
    case 'security':
      return <SecurityPanel user={user} profile={profile} />;
    case 'app':
      return <AppSettingsPanel settings={settings} />;
    case 'help':
      return <HelpPanel />;
    case 'about':
      return <AboutPanel />;
    default:
      return null;
  }
}

/* ==========================================================================
   1. EDIT PROFILE PANEL
   ========================================================================== */
function ProfilePanel({ profile, user }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    let finalAvatarUrl = profile.avatar_url;

    try {
      const supabase = createClient();
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('tapri-images')
          .upload(filePath, avatarFile, { contentType: avatarFile.type });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('tapri-images').getPublicUrl(filePath);
        finalAvatarUrl = data.publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          username: username,
          bio: bio,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh store profile
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (updatedProfile) {
        useAuthStore.getState().setProfile(updatedProfile);
      }

      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <User className="text-blue-primary" size={20} />
        <div>
          <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-poppins)]">
            Edit Profile
          </h2>
          <p className="text-xs text-text-dim mt-0.5">Customize how others see you in the community</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
          <Avatar src={avatarPreview} name={displayName || username} size="lg" className="w-24 h-24 text-3xl" />
          <div className="text-center sm:text-left space-y-2">
            <h4 className="font-semibold text-sm text-text-primary">Profile Avatar</h4>
            <p className="text-xs text-text-dim">Upload an image up to 2MB. Square dimensions fit best.</p>
            <label className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-bg-elevated hover:bg-border border border-border rounded-xl text-xs font-semibold cursor-pointer transition-colors text-text-primary">
              Choose Image
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              placeholder="Tell the neighborhood about yourself..."
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/40 transition-all resize-none"
            />
            <p className="text-right text-[10px] text-text-dim mt-1">{bio.length}/160</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-border">
          <Button type="submit" loading={isSaving}>
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ==========================================================================
   2. PRIVACY PANEL
   ========================================================================== */
function PrivacyPanel({ userMetadata, onSaveMetadata }) {
  const privacy = userMetadata?.privacy || {
    publicProfile: true,
    whoFollow: 'everyone',
    whoMessage: 'everyone',
    whoComment: 'everyone',
    showOnline: true,
    showLastSeen: true,
    showFollowers: true,
    blockedUsers: [],
    mutedUsers: []
  };

  const [profileSearchList, setProfileSearchList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const toggleSwitch = (key) => {
    onSaveMetadata({
      privacy: {
        ...privacy,
        [key]: !privacy[key]
      }
    });
    toast.success('Privacy preference updated.');
  };

  const handleSelectChange = (key, value) => {
    onSaveMetadata({
      privacy: {
        ...privacy,
        [key]: value
      }
    });
    toast.success('Permission updated.');
  };

  const searchUsers = async (val) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setProfileSearchList([]);
      return;
    }
    setSearching(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${val}%`)
        .limit(5);
      if (data) setProfileSearchList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const blockUser = (user) => {
    const list = privacy.blockedUsers || [];
    if (list.some(u => u.id === user.id)) {
      toast.error('User already blocked.');
      return;
    }
    const updated = [...list, { id: user.id, username: user.username, display_name: user.display_name, avatar_url: user.avatar_url }];
    onSaveMetadata({
      privacy: {
        ...privacy,
        blockedUsers: updated
      }
    });
    setSearchQuery('');
    setProfileSearchList([]);
    toast.success(`${user.display_name || user.username} blocked.`);
  };

  const unblockUser = (userId) => {
    const list = privacy.blockedUsers || [];
    const updated = list.filter(u => u.id !== userId);
    onSaveMetadata({
      privacy: {
        ...privacy,
        blockedUsers: updated
      }
    });
    toast.success('User unblocked.');
  };

  const muteUser = (user) => {
    const list = privacy.mutedUsers || [];
    if (list.some(u => u.id === user.id)) {
      toast.error('User already muted.');
      return;
    }
    const updated = [...list, { id: user.id, username: user.username, display_name: user.display_name, avatar_url: user.avatar_url }];
    onSaveMetadata({
      privacy: {
        ...privacy,
        mutedUsers: updated
      }
    });
    setSearchQuery('');
    setProfileSearchList([]);
    toast.success(`${user.display_name || user.username} muted.`);
  };

  const unmuteUser = (userId) => {
    const list = privacy.mutedUsers || [];
    const updated = list.filter(u => u.id !== userId);
    onSaveMetadata({
      privacy: {
        ...privacy,
        mutedUsers: updated
      }
    });
    toast.success('User unmuted.');
  };

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Lock className="text-blue-primary" size={20} />
        <div>
          <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-poppins)]">
            Privacy Settings
          </h2>
          <p className="text-xs text-text-dim mt-0.5">Control your profile visibility and interaction permissions</p>
        </div>
      </div>

      {/* Switches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 p-3 bg-bg-elevated rounded-xl border border-border">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">Public Profile</h4>
            <p className="text-xs text-text-dim mt-0.5">Allow anyone to view your posts, media, and circles.</p>
          </div>
          <Toggle checked={privacy.publicProfile} onChange={() => toggleSwitch('publicProfile')} />
        </div>

        <div className="flex items-center justify-between gap-4 p-3 bg-bg-elevated rounded-xl border border-border">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">Show Online Status</h4>
            <p className="text-xs text-text-dim mt-0.5">Displays a green indicator when you are active on the site.</p>
          </div>
          <Toggle checked={privacy.showOnline} onChange={() => toggleSwitch('showOnline')} />
        </div>

        <div className="flex items-center justify-between gap-4 p-3 bg-bg-elevated rounded-xl border border-border">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">Show Last Seen</h4>
            <p className="text-xs text-text-dim mt-0.5">Displays the last time you used the application.</p>
          </div>
          <Toggle checked={privacy.showLastSeen} onChange={() => toggleSwitch('showLastSeen')} />
        </div>

        <div className="flex items-center justify-between gap-4 p-3 bg-bg-elevated rounded-xl border border-border">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">Show Followers Count</h4>
            <p className="text-xs text-text-dim mt-0.5">Allow others to see how many neighbors are in your circle.</p>
          </div>
          <Toggle checked={privacy.showFollowers} onChange={() => toggleSwitch('showFollowers')} />
        </div>
      </div>

      {/* Dropdowns */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-sm font-bold text-text-primary font-[family-name:var(--font-poppins)]">Interaction Permissions</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Who can follow me</label>
            <select 
              value={privacy.whoFollow} 
              onChange={(e) => handleSelectChange('whoFollow', e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
            >
              <option value="everyone">Everyone</option>
              <option value="local">Local Neighbors Only</option>
              <option value="none">Nobody</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Who can message me</label>
            <select 
              value={privacy.whoMessage} 
              onChange={(e) => handleSelectChange('whoMessage', e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
            >
              <option value="everyone">Everyone</option>
              <option value="circle">My Circle Only</option>
              <option value="none">Nobody</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Who can comment</label>
            <select 
              value={privacy.whoComment} 
              onChange={(e) => handleSelectChange('whoComment', e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
            >
              <option value="everyone">Everyone</option>
              <option value="circle">My Circle Only</option>
              <option value="local">Locality Members Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Block & Mute management */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-sm font-bold text-text-primary font-[family-name:var(--font-poppins)]">Moderation & Safety</h3>
        
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">Search users to block/mute</label>
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => searchUsers(e.target.value)}
              placeholder="Type username..."
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none"
            />
            {searching && (
              <RefreshCw className="absolute right-3 top-2.5 text-text-dim animate-spin" size={14} />
            )}
            
            {/* Search results dropdown */}
            {profileSearchList.length > 0 && (
              <div className="absolute left-0 right-0 top-10 bg-bg-card border border-border rounded-xl shadow-lg z-10 p-2 divide-y divide-border">
                {profileSearchList.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      <Avatar src={u.avatar_url} name={u.display_name} size="xs" />
                      <div>
                        <p className="text-xs font-semibold text-text-primary">{u.display_name || u.username}</p>
                        <p className="text-[10px] text-text-dim">@{u.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => blockUser(u)} className="px-2 py-1 bg-accent-red/10 text-accent-red rounded text-[10px] font-bold hover:bg-accent-red/20 cursor-pointer">Block</button>
                      <button onClick={() => muteUser(u)} className="px-2 py-1 bg-accent-amber/10 text-accent-amber rounded text-[10px] font-bold hover:bg-accent-amber/20 cursor-pointer">Mute</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Blocked Users List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Blocked Users ({privacy.blockedUsers?.length || 0})</h4>
          {(!privacy.blockedUsers || privacy.blockedUsers.length === 0) ? (
            <p className="text-xs text-text-dim italic">No blocked users.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {privacy.blockedUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2.5 bg-bg-elevated border border-border rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar src={u.avatar_url} name={u.display_name} size="xs" />
                    <p className="text-xs font-semibold text-text-primary truncate">@{u.username}</p>
                  </div>
                  <button onClick={() => unblockUser(u.id)} className="text-xs text-blue-primary hover:underline font-semibold cursor-pointer">Unblock</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Muted Users List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Muted Users ({privacy.mutedUsers?.length || 0})</h4>
          {(!privacy.mutedUsers || privacy.mutedUsers.length === 0) ? (
            <p className="text-xs text-text-dim italic">No muted users.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {privacy.mutedUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2.5 bg-bg-elevated border border-border rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar src={u.avatar_url} name={u.display_name} size="xs" />
                    <p className="text-xs font-semibold text-text-primary truncate">@{u.username}</p>
                  </div>
                  <button onClick={() => unmuteUser(u.id)} className="text-xs text-blue-primary hover:underline font-semibold cursor-pointer">Unmute</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. NOTIFICATIONS PANEL
   ========================================================================== */
function NotificationsPanel({ userMetadata, onSaveMetadata }) {
  const notifs = userMetadata?.notifications || {
    likes: true,
    comments: true,
    replies: true,
    mentions: true,
    newFollowers: true,
    adviceReplies: true,
    confessReplies: true,
    communityUpdates: true,
    businessUpdates: true,
    trendingNearMe: true,
    pushEnabled: true,
    emailEnabled: true
  };

  const handleToggle = (key) => {
    onSaveMetadata({
      notifications: {
        ...notifs,
        [key]: !notifs[key]
      }
    });
    toast.success('Notification preferences saved.');
  };

  const toggleList = [
    { key: 'likes', label: 'Likes', desc: 'When someone likes your post or comment' },
    { key: 'comments', label: 'Comments', desc: 'When someone comments on your post' },
    { key: 'replies', label: 'Replies', desc: 'When someone replies to your comment' },
    { key: 'mentions', label: 'Mentions', desc: 'When someone tags you in a post or comment' },
    { key: 'newFollowers', label: 'New Followers', desc: 'When someone adds you to their circle' },
    { key: 'adviceReplies', label: 'Advice Replies', desc: 'When someone answers your advice questions' },
    { key: 'confessReplies', label: 'Confess Replies', desc: 'When someone interacts with your local confessions' },
    { key: 'communityUpdates', label: 'Community Updates', desc: 'Activity or notifications from communities you join' },
    { key: 'businessUpdates', label: 'Business Updates', desc: 'Deals or reviews from businesses you bookmark' },
    { key: 'trendingNearMe', label: 'Trending Near Me', desc: 'When a post starts trending in your locality' },
    { key: 'pushEnabled', label: 'Push Notifications', desc: 'Enable push alerts on your browser/mobile device' },
    { key: 'emailEnabled', label: 'Email Notifications', desc: 'Receive daily/weekly email digests of active content' }
  ];

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Bell className="text-blue-primary" size={20} />
        <div>
          <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-poppins)]">
            Notification Settings
          </h2>
          <p className="text-xs text-text-dim mt-0.5">Control when and how you receive alerts and messages</p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {toggleList.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div>
              <h4 className="text-sm font-semibold text-text-primary">{item.label}</h4>
              <p className="text-xs text-text-dim mt-0.5">{item.desc}</p>
            </div>
            <Toggle checked={notifs[item.key]} onChange={() => handleToggle(item.key)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   4. APPEARANCE PANEL
   ========================================================================== */
function AppearancePanel({ settings }) {
  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Palette className="text-blue-primary" size={20} />
        <div>
          <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-poppins)]">
            Appearance
          </h2>
          <p className="text-xs text-text-dim mt-0.5">Customize theme, layout spacing, and typography scales</p>
        </div>
      </div>

      {/* Themes picker */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Application Theme</h4>
        <div className="grid grid-cols-3 gap-3">
          {['light', 'dark', 'system'].map((t) => (
            <button
              key={t}
              onClick={() => {
                settings.setTheme(t);
                toast.success(`Theme set to ${t}`);
              }}
              className={cn(
                "py-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer",
                settings.theme === t
                  ? "bg-blue-primary/10 border-blue-primary text-blue-primary"
                  : "bg-bg-elevated border-border text-text-muted hover:border-text-dim hover:text-text-primary"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size picker */}
      <div className="space-y-2 pt-4 border-t border-border">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Typography Scale</h4>
        <div className="grid grid-cols-3 gap-3">
          {['small', 'medium', 'large'].map((size) => (
            <button
              key={size}
              onClick={() => {
                settings.setFontSize(size);
                toast.success(`Font size changed to ${size}`);
              }}
              className={cn(
                "py-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer",
                settings.fontSize === size
                  ? "bg-blue-primary/10 border-blue-primary text-blue-primary"
                  : "bg-bg-elevated border-border text-text-muted hover:border-text-dim hover:text-text-primary"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Other layout switches */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Layout Preferences</h4>
        
        <div className="flex items-center justify-between gap-4 p-3 bg-bg-elevated rounded-xl border border-border">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">Compact Layout</h4>
            <p className="text-xs text-text-dim mt-0.5">Reduce padding, spacing, and image dimensions for text-heavy content.</p>
          </div>
          <Toggle checked={settings.compact} onChange={() => {
            settings.setCompact(!settings.compact);
            toast.success(settings.compact ? 'Compact mode disabled' : 'Compact mode enabled');
          }} />
        </div>

        <div className="flex items-center justify-between gap-4 p-3 bg-bg-elevated rounded-xl border border-border">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">Enable UI Animations</h4>
            <p className="text-xs text-text-dim mt-0.5">Play smooth micro-animations, transitions, and hover effects.</p>
          </div>
          <Toggle checked={settings.animations} onChange={() => {
            settings.setAnimations(!settings.animations);
            toast.success(settings.animations ? 'UI animations disabled' : 'UI animations enabled');
          }} />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   5. LOCATION PREFERENCES PANEL
   ========================================================================== */
function LocationPanel({ settings, profile, user }) {
  const [city, setCity] = useState(profile?.city || '');
  const [locality, setLocality] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchLocalityName() {
      if (profile?.locality_id) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from('localities')
            .select('name')
            .eq('id', profile.locality_id)
            .maybeSingle();
          if (data) setLocality(data.name);
        } catch (e) {
          console.error(e);
        }
      }
    }
    fetchLocalityName();
  }, [profile?.locality_id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const supabase = createClient();
      
      // Attempt to resolve locality name to id
      let resolvedLocalityId = profile.locality_id;
      if (locality.trim().length > 0) {
        const { data: loc } = await supabase
          .from('localities')
          .select('id')
          .ilike('name', `%${locality}%`)
          .limit(1)
          .maybeSingle();
        if (loc) {
          resolvedLocalityId = loc.id;
        } else {
          toast.error(`Locality "${locality}" not found. Keeping previous locality.`);
        }
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('joined_locality_ids')
        .eq('id', user.id)
        .single();

      let updatePayload = {
        city: city,
        locality_id: resolvedLocalityId,
        updated_at: new Date().toISOString()
      };

      if (currentProfile && 'joined_locality_ids' in currentProfile) {
        const currentIds = currentProfile.joined_locality_ids || [];
        if (resolvedLocalityId && !currentIds.includes(resolvedLocalityId)) {
          updatePayload.joined_locality_ids = [...currentIds, resolvedLocalityId];
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id);

      if (error) throw error;

      // Update Zustand Auth profile info
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (updatedProfile) {
        useAuthStore.getState().setProfile(updatedProfile);
      }

      toast.success('Location settings updated successfully.');
    } catch (err) {
      toast.error('Failed to update location: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <MapPin className="text-blue-primary" size={20} />
        <div>
          <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-poppins)]">
            Location Preferences
          </h2>
          <p className="text-xs text-text-dim mt-0.5">Customize your home area to filter feeds and recommendations</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Hyderabad"
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Locality / Neighborhood
              </label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Gachibowli"
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
              Search & Feed Filter Radius
            </label>
            <select
              value={settings.searchRadius}
              onChange={(e) => {
                settings.setSearchRadius(e.target.value);
                toast.success(`Search radius updated to ${e.target.value === 'city' ? 'entire city' : `${e.target.value} km`}`);
              }}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none"
            >
              <option value="1">1 km (Strictly Hyperlocal)</option>
              <option value="5">5 km (Nearby Neighborhoods)</option>
              <option value="10">10 km (Wider City Suburbs)</option>
              <option value="city">Entire City (Show Everything)</option>
            </select>
            <p className="text-[10px] text-text-dim mt-1.5">
              Updates your active feed recommendations instantly when surfing community forums or trending lists.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-border">
          <Button type="submit" loading={isSaving}>
            Save Location Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ==========================================================================
   6. SAVED CONTENT PANEL
   ========================================================================== */
function SavedPanel({ user, userMetadata, onSaveMetadata }) {
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedAdvice, setSavedAdvice] = useState([]);
  const [savedBusinesses, setSavedBusinesses] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('posts');

  const savedAdviceIds = userMetadata?.saved_advice || [];
  const savedBusinessIds = userMetadata?.saved_businesses || [];

  const loadSavedContent = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // 1. Fetch Saved Posts
      const { data: postsData } = await supabase
        .from('saved_posts')
        .select(`
          post:posts (
            id, title, content, slug, category, created_at,
            profiles (username, display_name, avatar_url)
          )
        `)
        .eq('user_id', user.id);
      
      if (postsData) {
        setSavedPosts(postsData.map(p => p.post).filter(Boolean));
      }

      // 2. Fetch Saved Advice Posts (using saved ids metadata)
      if (savedAdviceIds.length > 0) {
        const { data: adviceData } = await supabase
          .from('advice_posts')
          .select(`
            id, title, content, category, slug, created_at,
            profiles (username, display_name, avatar_url)
          `)
          .in('id', savedAdviceIds);
        if (adviceData) setSavedAdvice(adviceData);
      } else {
        setSavedAdvice([]);
      }

      // 3. Fetch Saved Businesses (using saved ids metadata)
      if (savedBusinessIds.length > 0) {
        const { data: businessData } = await supabase
          .from('businesses')
          .select('id, name, slug, category, description, address, rating')
          .in('id', savedBusinessIds);
        if (businessData) setSavedBusinesses(businessData);
      } else {
        setSavedBusinesses([]);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) loadSavedContent();
  }, [user?.id, savedAdviceIds.length, savedBusinessIds.length]);

  const removeSavedPost = async (postId) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);
      if (error) throw error;
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post removed from saved list.');
    } catch (e) {
      toast.error('Failed to unsave post: ' + e.message);
    }
  };

  const removeSavedAdvice = (adviceId) => {
    const updated = savedAdviceIds.filter(id => id !== adviceId);
    onSaveMetadata({ saved_advice: updated });
    setSavedAdvice(prev => prev.filter(a => a.id !== adviceId));
    toast.success('Advice removed from saved list.');
  };

  const removeSavedBusiness = (businessId) => {
    const updated = savedBusinessIds.filter(id => id !== businessId);
    onSaveMetadata({ saved_businesses: updated });
    setSavedBusinesses(prev => prev.filter(b => b.id !== businessId));
    toast.success('Business removed from saved list.');
  };

  const subTabs = [
    { id: 'posts', label: 'Posts & Confessions', count: savedPosts.length },
    { id: 'advice', label: 'Advice Requests', count: savedAdvice.length },
    { id: 'businesses', label: 'Saved Businesses', count: savedBusinesses.length }
  ];

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Bookmark className="text-blue-primary" size={20} />
        <div>
          <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-poppins)]">
            Saved Content
          </h2>
          <p className="text-xs text-text-dim mt-0.5">Quickly access bookmarks and items you saved earlier</p>
        </div>
      </div>

      {/* Sub tabs header */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto no-scrollbar">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              activeSubTab === t.id
                ? "bg-bg-elevated border border-border text-blue-primary"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 py-6 animate-pulse">
          <div className="h-10 bg-bg-elevated rounded-xl w-full" />
          <div className="h-10 bg-bg-elevated rounded-xl w-5/6" />
        </div>
      ) : (
        <div className="space-y-4 min-h-[150px]">
          {activeSubTab === 'posts' && (
            savedPosts.length === 0 ? (
              <p className="text-sm text-text-dim italic text-center py-6">No saved posts or confessions.</p>
            ) : (
              <div className="space-y-3">
                {savedPosts.map(p => (
                  <div key={p.id} className="flex items-start justify-between gap-4 p-3 bg-bg-elevated border border-border rounded-xl">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-blue-primary uppercase tracking-wider bg-blue-primary/10 px-1.5 py-0.5 rounded">
                        {p.category}
                      </span>
                      <h4 className="text-sm font-semibold text-text-primary mt-1.5 truncate">{p.title}</h4>
                      <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{p.content}</p>
                    </div>
                    <button onClick={() => removeSavedPost(p.id)} className="p-1.5 text-text-dim hover:text-accent-red hover:bg-bg-card rounded-lg border border-transparent hover:border-border transition-all cursor-pointer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {activeSubTab === 'advice' && (
            savedAdvice.length === 0 ? (
              <p className="text-sm text-text-dim italic text-center py-6">No saved advice requests.</p>
            ) : (
              <div className="space-y-3">
                {savedAdvice.map(a => (
                  <div key={a.id} className="flex items-start justify-between gap-4 p-3 bg-bg-elevated border border-border rounded-xl">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-purple-secondary uppercase tracking-wider bg-purple-secondary/10 px-1.5 py-0.5 rounded">
                        {a.category}
                      </span>
                      <h4 className="text-sm font-semibold text-text-primary mt-1.5 truncate">{a.title}</h4>
                      <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{a.content}</p>
                    </div>
                    <button onClick={() => removeSavedAdvice(a.id)} className="p-1.5 text-text-dim hover:text-accent-red hover:bg-bg-card rounded-lg border border-transparent hover:border-border transition-all cursor-pointer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {activeSubTab === 'businesses' && (
            savedBusinesses.length === 0 ? (
              <p className="text-sm text-text-dim italic text-center py-6">No saved businesses.</p>
            ) : (
              <div className="space-y-3">
                {savedBusinesses.map(b => (
                  <div key={b.id} className="flex items-start justify-between gap-4 p-3 bg-bg-elevated border border-border rounded-xl">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-accent-green uppercase tracking-wider bg-accent-green/10 px-1.5 py-0.5 rounded">
                        ★ {b.rating || 'N/A'} rating
                      </span>
                      <h4 className="text-sm font-semibold text-text-primary mt-1.5 truncate">{b.name}</h4>
                      <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{b.description || b.address}</p>
                    </div>
                    <button onClick={() => removeSavedBusiness(b.id)} className="p-1.5 text-text-dim hover:text-accent-red hover:bg-bg-card rounded-lg border border-transparent hover:border-border transition-all cursor-pointer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   7. SECURITY PANEL
   ========================================================================== */
function SecurityPanel({ user, profile }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [showTfaModal, setShowTfaModal] = useState(false);
  
  const [sessions, setSessions] = useState([
    { id: '1', device: 'Windows PC • Chrome', location: 'Hyderabad, India', current: true, ip: '157.44.18.23' },
    { id: '2', device: 'Apple iPhone 14 Pro', location: 'Hyderabad, India', current: false, ip: '49.36.192.12' },
    { id: '3', device: 'Ubuntu Desktop • Firefox', location: 'Bengaluru, India', current: false, ip: '103.22.4.92' }
  ]);

  const handleLogoutOthers = () => {
    setSessions(prev => prev.filter(s => s.current));
    toast.success('Successfully logged out from other devices.');
  };

  const handleDownloadData = () => {
    const loadingToast = toast.loading('Compiling account details...');
    setTimeout(() => {
      const userData = {
        user_id: user.id,
        username: profile?.username || '',
        display_name: profile?.display_name || '',
        reputation: profile?.reputation_score || 0,
        city: profile?.city || '',
        export_date: new Date().toISOString()
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `rambhahoo-data-export-${user.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      toast.dismiss(loadingToast);
      toast.success('Your data report is ready and downloaded!');
    }, 2000);
  };

  const handleDeleteAccount = async () => {
    if (confirmInput !== 'DELETE') {
      toast.error('Verification failed. Type DELETE to confirm.');
      return;
    }
    setIsDeleting(true);
    try {
      const supabase = createClient();
      
      // Delete user profile rows (cascading deletes comments/posts/saved items automatically)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Sign out auth user
      await supabase.auth.signOut();
      useAuthStore.getState().signOut();
      
      toast.success('Account permanently deleted. Hope to see you back soon!');
      window.location.href = '/';
    } catch (e) {
      toast.error('Account deletion failed: ' + e.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6 relative">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <ShieldAlert className="text-blue-primary" size={20} />
        <div>
          <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-poppins)]">
            Security & Login
          </h2>
          <p className="text-xs text-text-dim mt-0.5">Manage session devices, two-factor authentication, and data controls</p>
        </div>
      </div>

      {/* Two-Factor Authentication Toggle */}
      <div className="flex items-center justify-between gap-4 p-3.5 bg-bg-elevated rounded-xl border border-border">
        <div>
          <h4 className="text-sm font-semibold text-text-primary">Two-Factor Authentication (2FA)</h4>
          <p className="text-xs text-text-dim mt-0.5">Require an authentication token code whenever logging in.</p>
        </div>
        <Toggle checked={tfaEnabled} onChange={() => {
          if (!tfaEnabled) {
            setShowTfaModal(true);
          } else {
            setTfaEnabled(false);
            toast.success('2FA Disabled.');
          }
        }} />
      </div>

      {/* Active Sessions */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Device Sessions</h4>
          {sessions.length > 1 && (
            <button onClick={handleLogoutOthers} className="text-xs text-accent-red hover:underline font-semibold cursor-pointer">
              Log out from other devices
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 p-3 bg-bg-elevated border border-border rounded-xl">
              <div>
                <p className="text-xs font-semibold text-text-primary">
                  {s.device}
                  {s.current && <span className="ml-2 text-[9px] font-bold text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded">Current</span>}
                </p>
                <p className="text-[10px] text-text-dim mt-0.5">{s.location} • IP: {s.ip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Export & Account Deletion */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Privacy & Data Control</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            onClick={handleDownloadData}
            className="flex items-center justify-center gap-2 py-3 bg-bg-elevated hover:bg-border border border-border rounded-xl text-xs font-bold text-text-primary cursor-pointer transition-all"
          >
            <Download size={14} />
            Download My Data Export
          </button>
          
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center gap-2 py-3 bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 rounded-xl text-xs font-bold text-accent-red cursor-pointer transition-all"
          >
            <Trash size={14} />
            Delete Account Permantently
          </button>
        </div>
      </div>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center p-4 z-20 backdrop-blur-sm">
          <div className="bg-bg-card border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-accent-red">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold text-text-primary font-[family-name:var(--font-poppins)]">Delete Account?</h3>
            </div>
            <p className="text-xs text-text-dim leading-relaxed">
              This action is permanent and cannot be undone. All your posts, comments, communities, and reputation points will be lost.
            </p>
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Type "DELETE" to confirm</label>
              <input 
                type="text" 
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-bg-elevated border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmInput('');
                }}
                className="flex-1 py-2 bg-bg-elevated border border-border rounded-xl text-xs font-bold text-text-primary cursor-pointer hover:bg-border transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmInput !== 'DELETE'}
                className="flex-1 py-2 bg-accent-red hover:bg-accent-red/90 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Placeholder Modal */}
      {showTfaModal && (
        <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center p-4 z-20 backdrop-blur-sm">
          <div className="bg-bg-card border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl text-center flex flex-col items-center">
            <Shield className="text-blue-primary animate-pulse" size={40} />
            <h3 className="text-base font-bold text-text-primary font-[family-name:var(--font-poppins)]">Setup Two-Factor (2FA)</h3>
            <p className="text-xs text-text-dim leading-relaxed">
              To secure your account, scan this QR code inside Google Authenticator or Duo Authenticator.
            </p>
            {/* Mock QR Code */}
            <div className="w-32 h-32 bg-white p-2 rounded-xl border border-border flex items-center justify-center shadow-sm">
              <div className="w-full h-full bg-[radial-gradient(#1e293b_3px,transparent_3px)] [background-size:8px_8px] opacity-75" />
            </div>
            <p className="text-[10px] text-text-dim">Code: <code>RAMBHAHOO-TFA-SEED-1782A</code></p>
            <div className="flex gap-2 w-full pt-2">
              <button 
                onClick={() => setShowTfaModal(false)}
                className="flex-1 py-2 bg-bg-elevated border border-border rounded-xl text-xs font-bold text-text-primary cursor-pointer hover:bg-border transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowTfaModal(false);
                  setTfaEnabled(true);
                  toast.success('2FA Setup Complete and Enabled.');
                }}
                className="flex-1 py-2 bg-blue-primary hover:bg-blue-hover text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   8. APP SETTINGS PANEL
   ========================================================================== */
function AppSettingsPanel({ settings }) {
  const [sessionCacheSize, setSessionCacheSize] = useState('0.00 KB');
  const [localStorageSize, setLocalStorageSize] = useState('0.00 KB');

  const calculateStorage = () => {
    // Session Storage Calc
    let sessionBytes = 0;
    for (let k in sessionStorage) {
      if (sessionStorage.hasOwnProperty(k)) {
        sessionBytes += (sessionStorage[k].length + k.length) * 2;
      }
    }
    setSessionCacheSize(formatBytes(sessionBytes));

    // Local Storage Calc
    let localBytes = 0;
    for (let k in localStorage) {
      if (localStorage.hasOwnProperty(k)) {
        localBytes += (localStorage[k].length + k.length) * 2;
      }
    }
    setLocalStorageSize(formatBytes(localBytes));
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0.00 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    calculateStorage();
  }, []);

  const handleClearCache = () => {
    sessionStorage.clear();
    calculateStorage();
    toast.success('Application session cache cleared successfully.');
  };

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Sliders className="text-blue-primary" size={20} />
        <div>
          <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-poppins)]">
            App Settings
          </h2>
          <p className="text-xs text-text-dim mt-0.5">Control image performance, network saver mode, and storage data</p>
        </div>
      </div>

      {/* Storage and Cache */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Device Storage</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-bg-elevated border border-border rounded-xl">
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Session Cache Size</p>
            <p className="text-lg font-bold text-text-primary mt-1">{sessionCacheSize}</p>
            <button 
              onClick={handleClearCache}
              className="mt-3 w-full py-1.5 bg-bg-card border border-border hover:border-text-dim rounded-lg text-[10px] font-bold text-text-primary transition-all cursor-pointer"
            >
              Clear Session Cache
            </button>
          </div>

          <div className="p-3 bg-bg-elevated border border-border rounded-xl">
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Local Preferences Size</p>
            <p className="text-lg font-bold text-text-primary mt-1">{localStorageSize}</p>
            <div className="w-full bg-border rounded-full h-1.5 mt-4 overflow-hidden">
              <div className="bg-blue-primary h-1.5 rounded-full" style={{ width: '4%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bandwidth & Quality toggles */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Media & Bandwidth Limits</h4>

        <div className="flex items-center justify-between gap-4 p-3 bg-bg-elevated rounded-xl border border-border">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">Data Saver Mode</h4>
            <p className="text-xs text-text-dim mt-0.5">Automatically reduces default media load qualities to save network limits.</p>
          </div>
          <Toggle checked={settings.dataSaver} onChange={() => {
            settings.setDataSaver(!settings.dataSaver);
            toast.success(settings.dataSaver ? 'Data Saver Disabled' : 'Data Saver Enabled');
          }} />
        </div>

        <div className="flex items-center justify-between gap-4 p-3 bg-bg-elevated rounded-xl border border-border">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">Load High Quality Images (Wi-Fi Only)</h4>
            <p className="text-xs text-text-dim mt-0.5">Disable loading high-res images on cellular network datasets.</p>
          </div>
          <Toggle 
            checked={settings.imageQuality === 'wifi'} 
            onChange={() => {
              const val = settings.imageQuality === 'high' ? 'wifi' : 'high';
              settings.setImageQuality(val);
              toast.success(`HQ Images set to: ${val === 'wifi' ? 'Wi-Fi only' : 'always high'}`);
            }} 
          />
        </div>

        <div className="flex items-center justify-between gap-4 p-3 bg-bg-elevated rounded-xl border border-border">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">Auto-play High Quality Videos (Wi-Fi Only)</h4>
            <p className="text-xs text-text-dim mt-0.5">Disable video auto-play bandwidth usage on mobile connections.</p>
          </div>
          <Toggle 
            checked={settings.videoQuality === 'wifi'} 
            onChange={() => {
              const val = settings.videoQuality === 'high' ? 'wifi' : 'high';
              settings.setVideoQuality(val);
              toast.success(`HQ Videos set to: ${val === 'wifi' ? 'Wi-Fi only' : 'always high'}`);
            }} 
          />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   9. HELP & SUPPORT PANEL
   ========================================================================== */
function HelpPanel() {
  const [expandedFaq, setExpandedFaq] = useState(null);
  
  const [formType, setFormType] = useState('bug'); // 'bug' | 'contact' | 'feature'
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const faqs = [
    { q: 'How do I raise my reputation score?', a: 'Reputation score increases when other neighbors interact with your posts or advice requests, e.g., liking your comments, marking your answers as helpful, or when posts you share start trending.' },
    { q: 'Can I post anonymously on Rambhahoo?', a: 'Yes! Local Confessions are anonymous by default. You can also toggle "Anonymous Mode" on individual Advice requests or Discussions to protect your privacy.' },
    { q: 'How do I verify my local business?', a: 'Head over to our Businesses page and click "Register Local Business". Once you upload proof of operation, our team will review and verify your listing.' },
    { q: 'What is the search radius filter?', a: 'It allows you to control how far you want to search. Setting it to 1 km filters your feeds strictly to Gachibowli or Banjara Hills (your active neighborhood), while 10 km covers neighboring towns.' }
  ];

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Please fill in all form fields.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubject('');
      setDescription('');
      setSubmitting(false);
      toast.custom((t) => (
        <div className="bg-bg-card border border-border p-4 rounded-2xl shadow-lg flex items-start gap-3 max-w-sm">
          <CheckCircle2 className="text-accent-green shrink-0 mt-0.5" size={20} />
          <div>
            <h5 className="font-bold text-text-primary text-sm">Feedback Submitted!</h5>
            <p className="text-xs text-text-muted mt-1">Thank you. Our team has received your ticket and will verify details shortly.</p>
          </div>
        </div>
      ));
    }, 1500);
  };

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <HelpCircle className="text-blue-primary" size={20} />
        <div>
          <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-poppins)]">
            Help & Support
          </h2>
          <p className="text-xs text-text-dim mt-0.5">Read frequently asked questions or contact our hyperlocal support desk</p>
        </div>
      </div>

      {/* FAQs accordions */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Frequently Asked Questions</h4>
        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className="bg-bg-elevated border border-border rounded-xl overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between p-3.5 text-left text-xs sm:text-sm font-semibold text-text-primary hover:bg-border/30 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {isExpanded && (
                  <p className="px-4 pb-3.5 text-xs text-text-muted leading-relaxed border-t border-border pt-2 bg-bg-card">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Form */}
      <form onSubmit={handleSupportSubmit} className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Contact Hyperlocal Desk</h4>
        
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'bug', label: 'Report Bug' },
            { id: 'contact', label: 'General Help' },
            { id: 'feature', label: 'Request Feature' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormType(f.id)}
              className={cn(
                "py-2 rounded-lg border text-[10px] sm:text-xs font-bold transition-all cursor-pointer",
                formType === f.id
                  ? "bg-blue-primary/10 border-blue-primary text-blue-primary"
                  : "bg-bg-elevated border-border text-text-muted hover:border-text-dim"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Subject</label>
            <input 
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of issue"
              className="w-full bg-bg-elevated border border-border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Details</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide steps to reproduce or details here..."
              rows={3}
              className="w-full bg-bg-elevated border border-border rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={submitting}>
            Send Support Ticket
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ==========================================================================
   10. ABOUT PANEL
   ========================================================================== */
function AboutPanel() {
  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Info className="text-blue-primary" size={20} />
        <div>
          <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-poppins)]">
            About Rambhahoo
          </h2>
          <p className="text-xs text-text-dim mt-0.5">Read hyperlocal guidelines, build history, and app versions</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
          Rambhahoo is Hyderabad's premium hyperlocal social network designed to bring local communities, verified neighborhoods, and businesses together in real-time. Join community forums, ask advice, confess locally, and explore neighborhood discussions.
        </p>

        {/* Release specifications */}
        <div className="p-4 bg-bg-elevated border border-border rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-muted">App Version</span>
            <span className="font-bold text-text-primary">1.4.0</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-muted">Build Number</span>
            <span className="font-mono text-text-primary text-[10px]">178128918-MAIN</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-muted">Environment</span>
            <span className="font-bold text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded text-[10px]">Production</span>
          </div>
        </div>

        {/* Guidelines / Policy Links */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Useful Links</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <a href="/privacy" className="text-blue-primary hover:underline font-semibold">Privacy Policy</a>
            <a href="/terms" className="text-blue-primary hover:underline font-semibold">Terms & Conditions</a>
            <a href="/guidelines" className="text-blue-primary hover:underline font-semibold">Community Guidelines</a>
            <a href="/about" className="text-blue-primary hover:underline font-semibold">What's New</a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   HELPER UTILITY COMPONENT: TOGGLE SWITCH
   ========================================================================== */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
        checked ? "bg-blue-primary" : "bg-border"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}
