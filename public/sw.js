// Organaiz Service Worker — manual (no build tool needed)
// Handles: offline fallback, push notifications, notification clicks

const CACHE_NAME = "organaiz-v1";
const OFFLINE_URL = "/offline";

// Install: cache the offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve offline fallback for navigation requests when network fails
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached || new Response("Offline", { status: 503 }))
      )
    );
  }
});

// Push: show notification
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Organaiz", body: event.data.text() };
  }

  // Call-type notification: aggressive vibrate, sticky, opens call screen
  if (data.type === "call") {
    const options = {
      body: data.body || "Incoming call...",
      icon: data.icon || "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/call", type: "call" },
      vibrate: [
        800, 200, 800, 200, 800, 200,
        800, 200, 800, 200, 800, 200,
        800, 200, 800, 200, 800, 200,
        800, 200, 800, 200, 800, 200,
      ],
      tag: "organaiz-call",
      renotify: true,
      requireInteraction: true,
      silent: false,
      actions: [
        { action: "accept", title: "Accept" },
        { action: "decline", title: "Decline" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Incoming Call", options)
    );
    return;
  }

  // Normal notification
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
    tag: data.tag || "organaiz-notification",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Organaiz", options)
  );
});

// Notification click: open/focus the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = data.url || "/";

  // Handle call notification actions
  if (data.type === "call") {
    if (event.action === "decline") {
      // Just close, don't open anything
      return;
    }
    // "accept" action or body tap — open call screen
    targetUrl = data.url || "/call";
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
