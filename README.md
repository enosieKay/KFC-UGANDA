KFC APP (Vite + React + Tailwind)

This workspace contains a minimal scaffold for the KFC app migrated off CDN/in-browser transforms.

Quick start (Windows PowerShell):

```powershell
# 1) Install dependencies
npm install

# 2) Start dev server
npm run dev

# 3) Build production bundle
npm run build

# 4) Preview production build locally
npm run preview
```

Notes:
- Do NOT use the Tailwind Play CDN (cdn.tailwindcss.com) in production. This scaffold uses Tailwind as a PostCSS plugin and produces a production-ready CSS file when you run `npm run build`.
- The original single-file app is `KFC-APP.html`. Copy/migrate the app logic into `src/App.jsx` (or split into components in `src/`) and remove CDN scripts (React UMD, Babel, tailwind CDN).
- If you want the full migration I can import your existing inline React code into `src/App.jsx` and wire it up. Reply "migrate app" to continue.
