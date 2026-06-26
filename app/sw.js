import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkFirst, NetworkOnly } from "serwist";

// Exclude Next.js prefetch/preflight requests, Supabase calls, and backend API routes from SW caching to save mobile CPU resources
const customCache = [
  {
    matcher({ url }) {
      return url.pathname === "/offline";
    },
    handler: new NetworkFirst(),
  },
  {
    matcher({ request, url }) {
      const isPrefetch = request?.headers?.get("Purpose") === "prefetch" || 
                         request?.headers?.get("x-middleware-preflight") === "1" ||
                         url.pathname.includes("/_next/data/");
      return (
        isPrefetch ||
        url.hostname.includes("supabase.co") || 
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/auth/")
      );
    },
    handler: new NetworkOnly(),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Handle Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Rambhahoo';
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-192x192.png',
      data: {
        url: data.url || '/'
      },
      vibrate: [100, 50, 100],
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error handling push event:', err);
  }
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If there is already a window open with matching origin/url, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Fallback: check if we can focus any client, navigate them, or open a new window
      if (windowClients.length > 0) {
        const client = windowClients[0];
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(urlToOpen);
          }
        }
      }
      
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
