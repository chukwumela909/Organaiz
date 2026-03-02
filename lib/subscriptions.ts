// In-memory subscription store (resets on restart)
// Replace with a database for production persistence

interface PushSub {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const subscriptions = new Map<string, PushSub>();

export function getSubscriptions(): PushSub[] {
  return Array.from(subscriptions.values());
}

export function addSubscription(sub: PushSub) {
  subscriptions.set(sub.endpoint, sub);
}

export function removeSubscription(endpoint: string) {
  subscriptions.delete(endpoint);
}
