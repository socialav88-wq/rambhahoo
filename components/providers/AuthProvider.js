'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

// Resilient profile retrieval with retry and fallback
async function getOrCreateProfile(supabase, user, mounted = true, setAuthError = null) {
  if (!user) return null;
  
  let profile = null;
  let retries = 5;
  
  while (retries > 0 && mounted) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    if (error && setAuthError) {
      setAuthError(`Select error: ${error.message}`);
    }
       
    if (data) {
      profile = data;
      break;
    }
    
    console.log(`[AUTH-PROFILE-RETRY] Profile not found yet for user ${user.id}. Retrying... (${retries} left)`);
    await new Promise(resolve => setTimeout(resolve, 500));
    retries--;
  }

  // Fallback: If still missing, insert a default profile
  if (!profile && mounted) {
    console.log(`[AUTH-PROFILE-FALLBACK] Profile still missing after retries. Creating fallback profile for user ${user.id}`);
    const metadata = user.user_metadata || user.raw_user_meta_data || {};
    const defaultUsername = metadata.username || `user_${user.id.substring(0, 8)}`;
    const defaultDisplayName = metadata.display_name || metadata.full_name || 'Rambhahoo User';
    const defaultAvatarUrl = metadata.avatar_url || metadata.picture || '';

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: defaultUsername,
        display_name: defaultDisplayName,
        avatar_url: defaultAvatarUrl
      })
      .select('*')
      .maybeSingle();

    if (!insertError && newProfile) {
      profile = newProfile;
      console.log(`[AUTH-PROFILE-FALLBACK-SUCCESS] Created fallback profile:`, profile.username);
    } else if (insertError) {
      console.error(`[AUTH-PROFILE-FALLBACK-ERROR] Failed to insert fallback profile:`, insertError.message);
      if (setAuthError) {
        setAuthError(`Insert error: ${insertError.message}`);
      }
    }
  }

  return profile;
}

export default function AuthProvider({ children }) {
  const { setUser, setProfile, setLoading, setAuthError } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    const authChannel = typeof window !== 'undefined' ? new BroadcastChannel('rambhahoo_auth_sync') : null;

    async function getSession() {
      console.log('[AUTH-PROVIDER] Checking initial session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setAuthError(`Session error: ${error.message}`);
          throw error;
        }

        if (session?.user && mounted) {
          console.log('[AUTH-PROVIDER-SESSION] Active session restored successfully. User ID:', session.user.id);
          setUser(session.user);
          // Fetch profile using resilient helper
          const profile = await getOrCreateProfile(supabase, session.user, mounted, setAuthError);
          if (profile && mounted) {
            console.log('[AUTH-PROVIDER-PROFILE] Profile loaded successfully:', profile.username);
            setProfile(profile);
          }
        } else {
          console.log('[AUTH-PROVIDER-SESSION] No active session found on startup.');
          if (mounted) {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('[AUTH-PROVIDER-ERROR] Error loading session on startup:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    getSession();

    if (authChannel) {
      authChannel.onmessage = (event) => {
        if (!mounted) return;
        console.log('[AUTH-PROVIDER-SYNC] Received auth message from another tab:', event.data);
        if (event.data === 'logout') {
          setUser(null);
          setProfile(null);
        } else if (event.data === 'login') {
          getSession();
        }
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log(`[AUTH-PROVIDER-EVENT] Auth state change event: ${event}. User ID in session:`, session?.user?.id || 'none');
        
        if (session?.user) {
          setUser(session.user);
          
          // Load or refresh the user profile to keep Zustand sync robust on ANY auth event (e.g. INITIAL_SESSION, TOKEN_REFRESHED, SIGNED_IN)
          const profile = await getOrCreateProfile(supabase, session.user, mounted, setAuthError);
          if (profile && mounted) {
            console.log(`[AUTH-PROVIDER-PROFILE] Profile synced on event ${event}:`, profile.username);
            setProfile(profile);
          }
          if (event === 'SIGNED_IN') {
            authChannel?.postMessage('login');
          }
        } else {
          console.log(`[AUTH-PROVIDER-EVENT] Session is null on event: ${event}. Clearing auth store.`);
          setUser(null);
          setProfile(null);
          if (event === 'SIGNED_OUT') {
            authChannel?.postMessage('logout');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      authChannel?.close();
    };
  }, []);

  return children;
}
