'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/push';

/**
 * Saves or updates a push subscription for the logged-in user.
 */
export async function subscribeUser(subscription) {
  if (!isSupabaseConfigured()) return { error: 'Supabase is not configured.' };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return { error: 'Invalid subscription object' };
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) {
      console.error('Error saving subscription to DB:', error.message);
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to subscribe user:', err);
    return { error: err.message };
  }
}

/**
 * Removes a push subscription for the logged-in user.
 */
export async function unsubscribeUser(endpoint) {
  if (!isSupabaseConfigured()) return { error: 'Supabase is not configured.' };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Error deleting subscription:', error.message);
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to unsubscribe user:', err);
    return { error: err.message };
  }
}

/**
 * Consolidates notification creation and triggers the push notification to the recipient.
 */
export async function createNotificationAndSendPush({ userId, actorId, type, referenceId, content }) {
  if (!isSupabaseConfigured()) return { error: 'Supabase is not configured.' };
  if (userId === actorId) return { success: true, reason: 'Self-interaction, push skipped' };

  try {
    const supabase = await createClient();

    // 1. Insert notification into the DB
    const { data: notif, error: notifErr } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        actor_id: actorId,
        type,
        reference_id: referenceId,
        content: content || null,
        is_read: false
      })
      .select()
      .single();

    if (notifErr) {
      console.error('Failed to create notification in DB:', notifErr.message);
      return { error: notifErr.message };
    }

    // 2. Fetch actor profile info
    const { data: actor } = await supabase
      .from('profiles')
      .select('display_name, username, avatar_url')
      .eq('id', actorId)
      .single();

    const name = actor?.display_name || actor?.username || 'Someone';
    
    // 3. Setup message body & URL based on notification type
    let body = '';
    let url = '/notifications';
    
    if (type === 'POST_LIKE' || type === 'like') {
      const { data: post } = await supabase.from('posts').select('title, slug').eq('id', referenceId).single();
      body = `${name} liked your post`;
      if (post?.slug) url = `/post/${post.slug}`;
    } else if (type === 'POST_REACTION') {
      const emoji = content || '❤️';
      body = `${name} reacted ${emoji} to your post`;
      const { data: post } = await supabase.from('posts').select('slug').eq('id', referenceId).single();
      if (post?.slug) url = `/post/${post.slug}`;
    } else if (type === 'POST_COMMENT' || type === 'comment') {
      body = `${name} commented on your post`;
      const { data: post } = await supabase.from('posts').select('slug').eq('id', referenceId).single();
      if (post?.slug) url = `/post/${post.slug}`;
    } else if (type === 'COMMENT_REPLY') {
      body = `${name} replied to your comment`;
      const { data: post } = await supabase.from('posts').select('slug').eq('id', referenceId).single();
      if (post?.slug) url = `/post/${post.slug}`;
    } else if (type === 'POLL_VOTE') {
      body = `${name} voted in your poll`;
      const { data: post } = await supabase.from('posts').select('slug').eq('id', referenceId).single();
      if (post?.slug) url = `/post/${post.slug}`;
    } else if (type === 'CIRCLE_ADD' || type === 'follow') {
      body = `${name} added you to their Circle`;
      if (actor?.username) url = `/profile/${actor.username}`;
    } else if (type === 'MENTION') {
      body = `${name} mentioned you`;
      const { data: post } = await supabase.from('posts').select('slug').eq('id', referenceId).single();
      if (post?.slug) url = `/post/${post.slug}`;
    } else if (type === 'POST_REPORT') {
      body = `Reported post: ${content || 'Inappropriate content'}`;
      const { data: post } = await supabase.from('posts').select('slug').eq('id', referenceId).single();
      if (post?.slug) url = `/post/${post.slug}`;
    } else if (type === 'SYSTEM') {
      body = content || 'System alert';
    } else if (type === 'EVENT_RSVP' || type === 'rsvp') {
      const { data: post } = await supabase.from('posts').select('title, slug').eq('id', referenceId).single();
      body = `${name} is going to your event: "${post?.title || 'Untitled'}"`;
      if (post?.slug) url = `/post/${post.slug}`;
    } else if (type === 'ADVICE_REPLY') {
      const { data: adv } = await supabase.from('advice_posts').select('title, slug').eq('id', referenceId).maybeSingle();
      body = `${name} offered advice on your question`;
      if (adv?.slug) url = `/advice/post/${adv.slug}`;
    } else if (type === 'ADVICE_REPLY_HELPFUL') {
      const { data: reply } = await supabase.from('advice_replies').select('advice_post_id').eq('id', referenceId).maybeSingle();
      const { data: adv } = reply ? await supabase.from('advice_posts').select('slug').eq('id', reply.advice_post_id).maybeSingle() : { data: null };
      const ratingText = content === 'very_helpful' ? 'very helpful' : content === 'best_advice' ? 'best advice' : 'helpful';
      body = `${name} marked your reply as ${ratingText}`;
      if (adv?.slug) url = `/advice/post/${adv.slug}`;
    } else if (type === 'ADVICE_BEST_SELECTION') {
      const { data: reply } = await supabase.from('advice_replies').select('advice_post_id').eq('id', referenceId).maybeSingle();
      const { data: adv } = reply ? await supabase.from('advice_posts').select('slug').eq('id', reply.advice_post_id).maybeSingle() : { data: null };
      body = `🏆 ${name} selected your reply as the Best Advice!`;
      if (adv?.slug) url = `/advice/post/${adv.slug}`;
    } else if (type === 'ADVICE_POST_FOLLOW') {
      const { data: adv } = await supabase.from('advice_posts').select('title, slug').eq('id', referenceId).maybeSingle();
      body = `${name} followed your advice question`;
      if (adv?.slug) url = `/advice/post/${adv.slug}`;
    } else if (type === 'ADVICE_FOLLOWER_NEW_REPLY') {
      const { data: adv } = await supabase.from('advice_posts').select('title, slug').eq('id', referenceId).maybeSingle();
      body = `New advice offered on followed question: "${adv?.title || 'Untitled'}"`;
      if (adv?.slug) url = `/advice/post/${adv.slug}`;
    } else if (type === 'ADVICE_FOLLOWER_UPDATE') {
      const { data: adv } = await supabase.from('advice_posts').select('title, slug').eq('id', referenceId).maybeSingle();
      body = `Author updated followed advice thread: "${adv?.title || 'Untitled'}"`;
      if (adv?.slug) url = `/advice/post/${adv.slug}`;
    } else if (type === 'ADVICE_FOLLOWER_BEST') {
      const { data: adv } = await supabase.from('advice_posts').select('title, slug').eq('id', referenceId).maybeSingle();
      body = `Best advice selected on followed question: "${adv?.title || 'Untitled'}"`;
      if (adv?.slug) url = `/advice/post/${adv.slug}`;
    } else {
      body = `You have a new notification from ${name}`;
    }

    // 4. Send Push Notification
    const payload = {
      title: 'Rambhahoo',
      body,
      url,
      icon: actor?.avatar_url || '/icon-192x192.png',
      badge: '/icon-192x192.png'
    };

    const pushResult = await sendPushNotification(userId, payload);
    return { success: true, notification: notif, pushResult };
  } catch (err) {
    console.error('Error in createNotificationAndSendPush:', err);
    return { error: err.message };
  }
}

/**
 * Parses content for @username mentions and sends a notification to matched users.
 */
export async function parseMentionsAndNotify({ content, referenceId, actorId, isPost = true }) {
  if (!content) return;
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = [...content.matchAll(mentionRegex)];
  const usernames = [...new Set(matches.map(m => m[1].toLowerCase()))];
  if (usernames.length === 0) return;

  try {
    const supabase = await createClient();
    
    for (const username of usernames) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (profile && profile.id !== actorId) {
        await createNotificationAndSendPush({
          userId: profile.id,
          actorId,
          type: 'MENTION',
          referenceId,
          content: isPost ? 'post' : 'comment'
        });
      }
    }
  } catch (err) {
    console.error('Failed to parse mentions and notify:', err);
  }
}

