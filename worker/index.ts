/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

// Listen for push events
sw.addEventListener("push", ((event: PushEvent) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || "",
      icon: data.icon || "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        url: data.url || "/",
      },
      vibrate: [100, 50, 100],
      tag: data.tag || "organaiz-notification",
      renotify: true,
    } as NotificationOptions;

    event.waitUntil(
      sw.registration.showNotification(data.title || "Organaiz", options)
    );
  } catch {
    // If payload isn't JSON, show a generic notification
    event.waitUntil(
      sw.registration.showNotification("Organaiz", {
        body: event.data!.text(),
        icon: "/icon-192.png",
      })
    );
  }
}) as any);

// Handle notification click — open or focus the app
sw.addEventListener("notificationclick", ((event: NotificationEvent) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If the app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return (client as WindowClient).focus();
          }
        }
        // Otherwise open a new window
        return sw.clients.openWindow(targetUrl);
      })
  );
}) as any);
