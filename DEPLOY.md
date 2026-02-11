# Deployment Guide: M&A Intelligence Hub

## 🚀 Easy Vercel Deployment (Recommended)

The project is now configured for **Zero Config** deployment on Vercel.

1.  **Install Vercel CLI**:
    ```bash
    npm i -g vercel
    ```

2.  **Deploy**:
    Run this command in the project folder:
    ```bash
    npx vercel --prod
    ```

3.  **Follow Prompts**:
    - Set up and deploy? **Y**
    - Which scope? **(Select your account)**
    - Link to existing project? **N**
    - Project name? **ma-intelligence-hub**
    - Directory? **./** (default)
    - Modify settings? **N** (default)

The site will be live in seconds!

## 📦 Netlify / Other Hosts

Since this is a static site (HTML/CSS/JS), you can drag and drop the folder to Netlify's uploader or use GitHub Pages.

### Important Notes

- **Environment Variables**: For the dashboard to work in production, you must set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your Vercel Project Settings > Environment Variables.
- **CORS**: The dashboard `file://` check is only for local testing. It won't trigger on a real domain.
