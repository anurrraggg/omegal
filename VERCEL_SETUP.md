# Quick Fix: Vercel Environment Variable Setup

## The Problem
Your frontend is trying to connect to `http://localhost:3000` instead of your production backend because the `VITE_BACKEND_URL` environment variable is not set in Vercel.

## Solution: Set Environment Variable in Vercel

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Find and click on your project: **omegal-indol** (or whatever your project name is)

### Step 2: Add Environment Variable
1. Click on **Settings** (top navigation)
2. Click on **Environment Variables** (left sidebar)
3. Click **Add New** button
4. Fill in:
   - **Key:** `VITE_BACKEND_URL`
   - **Value:** `https://omegal-50vd.onrender.com`
   - **Environment:** Select all three:
     - ☑ Production
     - ☑ Preview  
     - ☑ Development
5. Click **Save**

### Step 3: Redeploy (CRITICAL!)
**This is the most important step!** Environment variables only take effect after a new deployment.

1. Go to the **Deployments** tab
2. Find your latest deployment
3. Click the **three dots (⋯)** menu on the right
4. Click **Redeploy**
5. Confirm the redeploy

### Step 4: Verify
1. Wait for the deployment to complete (usually 1-2 minutes)
2. Visit your site: https://omegal-indol.vercel.app
3. Open browser console (F12)
4. You should see the backend URL logged (if in dev mode)
5. The connection should now go to `https://omegal-50vd.onrender.com` instead of `localhost:3000`

## Why This Happens
Vite environment variables (those starting with `VITE_`) are embedded into your code **at build time**, not runtime. This means:
- ✅ If you set the variable BEFORE building → it works
- ❌ If you set the variable AFTER building → it doesn't work until you rebuild

That's why you MUST redeploy after setting the environment variable.

## Troubleshooting

### Still seeing localhost:3000?
- Make sure you **redeployed** after setting the variable
- Check that the variable name is exactly `VITE_BACKEND_URL` (case-sensitive)
- Verify the value is exactly `https://omegal-50vd.onrender.com` (no trailing slash)
- Check the deployment logs to see if the variable was picked up

### How to check if variable is set:
1. Go to Deployments tab
2. Click on a deployment
3. Click on "Build Logs"
4. Look for environment variables being loaded (Vercel shows this)

### Alternative: Check in code
The code now has a production fallback, but it's better to set the environment variable properly.

