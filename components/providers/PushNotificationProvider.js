'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { subscribeUser, unsubscribeUser } from '@/app/actions/pushActions';
import toast from 'react-hot-toast';

const PushNotificationContext = createContext({
  isSupported: false,
  isSubscribed: false,
  permissionStatus: 'default',
  isSubscribing: false,
  subscribeToPush: async () => {},
  unsubscribeFromPush: async () => {},
});

export const usePushNotifications = () => useContext(PushNotificationContext);

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationProvider({ children }) {
  const { user } = useAuthStore();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    ) {
      setIsSupported(true);
      setPermissionStatus(Notification.permission);

      const initServiceWorker = async () => {
        try {
          const register = async () => {
            // Register Serwist compiled sw.js
            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            setRegistration(reg);
            
            // Check for active subscription
            const sub = await reg.pushManager.getSubscription();
            setIsSubscribed(!!sub);
          };

          // Defer SW registration to after page load/idle to prevent blocking mobile render
          if (document.readyState === 'complete') {
            register();
          } else {
            window.addEventListener('load', register, { once: true });
          }
        } catch (err) {
          console.warn('Service Worker registration or push check failed:', err);
        }
      };

      initServiceWorker();
    }
  }, []);

  // Sync / Refresh subscription on backend if permission is granted and user logs in
  useEffect(() => {
    if (!user || !isSupported || !registration || Notification.permission !== 'granted') return;

    const syncSubscription = async () => {
      try {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          const subJSON = JSON.parse(JSON.stringify(sub));
          await subscribeUser(subJSON);
          setIsSubscribed(true);
        }
      } catch (err) {
        console.warn('Failed to auto-sync existing push subscription:', err);
      }
    };

    syncSubscription();
  }, [user, isSupported, registration]);

  const subscribeToPush = async () => {
    if (!isSupported || !registration) {
      toast.error('Push notifications are not supported on this browser or device.');
      return;
    }

    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission !== 'granted') {
        toast.error('Permission for notifications was denied.');
        setIsSubscribing(false);
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key is missing in environmental variables.');
        toast.error('Notification service is misconfigured (missing VAPID key).');
        setIsSubscribing(false);
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Clean up any existing active subscription first
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subJSON = JSON.parse(JSON.stringify(subscription));
      const res = await subscribeUser(subJSON);

      if (res?.error) {
        toast.error('Failed to register device: ' + res.error);
        await subscription.unsubscribe();
        setIsSubscribed(false);
      } else {
        setIsSubscribed(true);
        toast.success('Push notifications enabled successfully!');
      }
    } catch (err) {
      console.error('Push subscription error:', err);
      toast.error('Failed to enable push notifications: ' + err.message);
      setIsSubscribed(false);
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!registration) return;

    setIsSubscribing(true);
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        const res = await unsubscribeUser(subscription.endpoint);
        if (res?.error) {
          console.warn('Unsubscribed locally but failed to delete from backend:', res.error);
        }
        setIsSubscribed(false);
        toast.success('Push notifications disabled.');
      }
    } catch (err) {
      console.error('Push unsubscription error:', err);
      toast.error('Failed to disable push notifications: ' + err.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <PushNotificationContext.Provider
      value={{
        isSupported,
        isSubscribed,
        permissionStatus,
        isSubscribing,
        subscribeToPush,
        unsubscribeFromPush,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
}
