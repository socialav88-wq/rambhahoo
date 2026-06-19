import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@rambhahoo.com';

let isConfigured = false;
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    isConfigured = true;
  } catch (err) {
    console.error('Failed to configure web-push VAPID details:', err);
  }
} else {
  console.warn('Web Push VAPID keys not configured in environment variables.');
}

/**
 * Sends a push notification to all subscriptions of a specific user.
 * 
 * @param {string} userId - The target user's UUID.
 * @param {object} payload - Notification data (title, body, url, icon, badge).
 */
export async function sendPushNotification(userId, payload) {
  if (!isConfigured) {
    console.warn('Cannot send push notification: VAPID keys not configured');
    return { success: false, reason: 'VAPID keys not configured' };
  }

  try {
    const supabase = await createClient();

    // Call our SECURITY DEFINER RPC to get the subscriptions for this user
    const { data: subscriptions, error } = await supabase.rpc('get_user_push_subscriptions', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error fetching push subscriptions:', error.message);
      return { success: false, error: error.message };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, sent: 0 };
    }

    const payloadString = JSON.stringify(payload);
    let sentCount = 0;

    const pushPromises = subscriptions.map(async (sub) => {
      // Map database fields to web-push format
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payloadString);
        sentCount++;
      } catch (err) {
        // If subscription is expired or invalid (404 or 410), delete it
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`Push subscription expired (status ${err.statusCode}). Deleting:`, sub.endpoint);
          await supabase.rpc('delete_push_subscription_by_endpoint', {
            sub_endpoint: sub.endpoint
          });
        } else {
          console.error('Error sending push notification to endpoint:', sub.endpoint, err);
        }
      }
    });

    await Promise.all(pushPromises);

    return { success: true, sent: sentCount };
  } catch (err) {
    console.error('Failed to send push notification:', err);
    return { success: false, error: err.message };
  }
}
