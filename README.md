# HearCare Tanzania — Admin Website

Friendly web dashboard for non-technical clinic coordinators to manage health articles (including Word/Markdown/PDF import and images), audiologists, clinics, weekly schedules, and appointments.

## Local development
1. Start `hearcare-backend` on port `4000`.
2. Copy `.env.example` to `.env` if you need a different API URL (`VITE_API_URL=http://localhost:4000`).
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Sign in with the seeded admin account (`admin@hearcare.local` / `ChangeMe123!`) and change your password in **My account**.

## Build & Deploy (Netlify / Vercel / Cloudflare Pages)
```bash
npm run typecheck
npm run build
```
- Output folder: `dist/`
- SPA redirects are already configured in `public/_redirects`, `netlify.toml`, and `vercel.json`.
- Set environment variable `VITE_API_URL` to your deployed backend URL (e.g. `https://api.hearcare.tz`).
