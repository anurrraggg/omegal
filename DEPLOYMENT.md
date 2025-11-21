# Deployment Guide

This guide will help you deploy your frontend to Vercel and backend to Render.

## Prerequisites

1. GitHub account with your code pushed to a repository
2. Vercel account (sign up at https://vercel.com)
3. Render account (sign up at https://render.com)

## Frontend Deployment (Vercel)

### Step 1: Install Dependencies
First, make sure to install the new dependencies:
```bash
cd backend
npm install
```

### Step 2: Deploy to Vercel

1. **Via Vercel CLI:**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```
   When prompted:
   - Set root directory to `frontend` or use the root (vercel.json will handle it)
   - Confirm settings

2. **Via Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Configure the project:
     - **Framework Preset:** Vite
     - **Root Directory:** `frontend` (or leave as root if using vercel.json)
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
     - **Install Command:** `npm install`

### Step 3: Set Environment Variables in Vercel

After deployment, you'll need to add an environment variable:

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add:
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** `https://your-backend-url.onrender.com` (you'll get this after deploying backend)
   - Apply to: Production, Preview, and Development

4. Redeploy your frontend after adding the environment variable

## Backend Deployment (Render)

### Step 1: Create a Web Service

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name:** `omegal-backend` (or your preferred name)
   - **Environment:** Node
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`

### Step 2: Set Environment Variables in Render

1. In your Render service settings, go to "Environment"
2. Add the following environment variables:
   - **NODE_ENV:** `production`
   - **PORT:** `3000` (Render will override this automatically, but good to set)
   - **FRONTEND_URL:** `https://your-frontend-url.vercel.app` (your Vercel frontend URL)

### Step 3: Alternative - Using render.yaml

If you prefer using the `render.yaml` file:

1. Update `FRONTEND_URL` in `render.yaml` with your actual Vercel URL
2. In Render dashboard, go to "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically detect `render.yaml` and create the service

### Important Notes:

- After deploying backend, copy the Render URL (e.g., `https://omegal-backend.onrender.com`)
- Update the `VITE_BACKEND_URL` in Vercel with this backend URL
- Redeploy frontend after updating the environment variable
- Also update `FRONTEND_URL` in Render with your Vercel frontend URL

## Testing Deployment

1. Visit your Vercel frontend URL
2. Check browser console for any connection errors
3. Test WebSocket connections to ensure they work correctly
4. Monitor Render logs to ensure backend is running properly

## Troubleshooting

### Frontend Issues:
- Make sure `VITE_BACKEND_URL` is set correctly (must start with `https://`)
- Check that you've redeployed after setting environment variables
- Verify CORS is properly configured in backend

### Backend Issues:
- Check Render logs for build errors
- Ensure all dependencies are in `package.json`
- Verify `FRONTEND_URL` matches your actual Vercel URL
- Check that PORT environment variable is being used

### WebSocket Issues:
- Ensure both frontend and backend URLs use HTTPS (not HTTP)
- Check CORS configuration allows your frontend origin
- Verify Socket.io CORS settings include your frontend URL

