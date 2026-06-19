import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProfileRedirectPage() {
  const supabase = await createClient();
  
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch {}

  if (!user) {
    redirect('/login');
  }

  let profile = null;
  
  // Retry querying profile to handle database trigger lag
  let retries = 5;
  while (retries > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();
      
    if (data) {
      profile = data;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    retries--;
  }

  // Fallback: If still missing, create a default profile row
  if (!profile) {
    const metadata = user.user_metadata || user.raw_user_meta_data || {};
    const defaultUsername = metadata.username || `user_${user.id.substring(0, 8)}`;
    const defaultDisplayName = metadata.display_name || metadata.full_name || 'Rambhahoo User';
    const defaultAvatarUrl = metadata.avatar_url || '';

    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: defaultUsername,
        display_name: defaultDisplayName,
        avatar_url: defaultAvatarUrl
      })
      .select('username')
      .maybeSingle();
      
    if (newProfile) {
      profile = newProfile;
    }
  }

  if (profile?.username) {
    redirect(`/profile/${profile.username}`);
  }

  redirect('/login');
}
