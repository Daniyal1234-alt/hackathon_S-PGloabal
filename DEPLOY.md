# Deployment Guide

The M&A Intelligence Hub is a static site (HTML/CSS/JS) ready for immediate deployment.

## Option 1: Vercel CLI (Recommended)

Since the project includes a `vercel.json` configuration, deploying via CLI is straightforward.

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   npx vercel login
   ```

3. **Deploy**:
   Run this command in the project root:
   ```bash
   npx vercel --prod
   ```
   - Follow the prompts (Keep default settings: `No` to modify settings, scope to your user).

## Option 2: Drag & Drop (Netlify / Vercel Dashboard)

1. Go to [vercel.com/new](https://vercel.com/new) or [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the entire `hackathon_S-PGloabal` folder into the upload area.
3. The site will publish instantly.

## Option 3: GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings > Pages**.
3. Select `main` branch and `/ (root)` folder.
4. Click **Save**.

## Environment Variables

Since this is a client-side app, your `config.js` or `.env` values are bundled.
- Ensure your `config.js` has the correct Supabase URL and Key before deploying.
- The `.env` file itself is **not** used in production for static sites; the values must be in `config.js`.
