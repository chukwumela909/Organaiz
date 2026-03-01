# Next.js Production PWA Implementation Guide

## Objective

Convert this Next.js (App Router) application into a fully compliant Progressive Web App (PWA) that:

- Installs on iPhone via Safari "Add to Home Screen"
- Opens in standalone mode (no Safari UI)
- Registers a service worker
- Works on iOS and Android
- Meets production standards
- Supports offline fallback
- Uses secure caching

This setup assumes:
- Next.js 13+ (App Router)
- HTTPS deployment
- Production environment

---

# 1. Install Dependency

```bash
npm install next-pwa
```

---

# 2. Configure `next.config.js`

Replace or update:

```js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
});

module.exports = withPWA({
  reactStrictMode: true,
});
```

This:
- Auto-generates service worker
- Enables offline support
- Disables PWA in development
- Uses offline fallback page

---

# 3. Create `manifest.json`

Create:

`/public/manifest.json`

```json
{
  "name": "WorldStreet Trading",
  "short_name": "WorldStreet",
  "description": "Advanced Trading Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait",
  "scope": "/",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ]
}
```

---

# 4. Add Required Icons

Place inside `/public`:

- icon-192.png (192x192)
- icon-512.png (512x512)
- apple-touch-icon.png (180x180)

Requirements:
- PNG format
- High resolution
- No blurry scaling
- No unwanted transparency

---

# 5. Configure App Router Metadata

Edit:

`app/layout.tsx`

Add:

```tsx
export const metadata = {
  title: "WorldStreet Trading",
  description: "Advanced Trading Platform",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WorldStreet",
  },
};
```

Inside `<head>` include:

```tsx
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

---

# 6. Create Offline Page

Create:

`app/offline/page.tsx`

```tsx
export default function OfflinePage() {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#000",
      color: "#fff",
      fontSize: "18px"
    }}>
      You are offline. Please reconnect.
    </div>
  );
}
```

---

# 7. Improve Native Feel (Optional but Recommended)

Add to global CSS:

```css
html, body {
  overscroll-behavior-y: none;
  -webkit-tap-highlight-color: transparent;
}
```

Optional improvements:
- Lock orientation to portrait
- Disable zoom via viewport meta
- Add smooth transitions
- Dark theme for trading UI

---

# 8. HTTPS Requirement

PWA installation requires:

- Valid SSL certificate
- No mixed HTTP content
- Production deployment over HTTPS

PWAs will NOT install without HTTPS.

---

# 9. Production Build & Test

Run:

```bash
npm run build
npm run start
```

Then:

On iPhone:
1. Open in Safari
2. Tap Share
3. Tap "Add to Home Screen"
4. Launch from home screen

Verify:
- No Safari address bar
- Fullscreen launch
- Correct icon
- Proper splash behavior
- Offline fallback works

---

# 10. Advanced Production Improvements (Optional)

For fintech/trading apps consider:

- NetworkFirst caching for API routes
- Cache static assets only
- Disable caching for authenticated requests
- Add push notifications (VAPID + APNs required)
- Add background sync
- Add install analytics tracking

---

# Expected Result

The application should:

- Install like a native app
- Launch fullscreen
- Feel like a real mobile app
- Work on iOS and Android
- Function offline with fallback page
- Maintain production-grade performance

---

End of implementation guide.