# Environment Variables Configuration

This document lists all required environment variables for deployment.

## Vercel (Frontend)

### Required Environment Variable

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_BACKEND_URL` | `https://omegal-50vd.onrender.com` | Backend API and WebSocket server URL |

### How to Set in Vercel

1. Go to your project on Vercel dashboard: https://vercel.com/dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the variable:
   - **Key:** `VITE_BACKEND_URL`
   - **Value:** `https://omegal-50vd.onrender.com`
   - **Environment:** Select Production, Preview, and Development
4. **IMPORTANT:** Redeploy your application after adding/updating the variable
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**

## Render (Backend)

### Required Environment Variables

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3000` | Server port (Render may override this) |
| `FRONTEND_URL` | `https://omegal-indol.vercel.app` | Frontend URL for CORS configuration |

### How to Set in Render

1. Go to your service on Render dashboard: https://dashboard.render.com
2. Navigate to **Environment** tab
3. Add each variable:
   - Click **Add Environment Variable**
   - Enter the key and value from the table above
4. The service will automatically restart after adding variables

**Alternative:** If using `render.yaml` (Blueprint deployment), the `FRONTEND_URL` is already configured in the file.

## Quick Checklist

- [ ] `VITE_BACKEND_URL` set in Vercel to `https://omegal-50vd.onrender.com`
- [ ] Vercel application redeployed after setting environment variable
- [ ] `FRONTEND_URL` set in Render to `https://omegal-indol.vercel.app`
- [ ] `NODE_ENV` set to `production` in Render
- [ ] `PORT` set to `3000` in Render (optional, Render may override)

## Troubleshooting

### Frontend can't connect to backend
- Verify `VITE_BACKEND_URL` is set correctly in Vercel
- Make sure you redeployed Vercel after setting the variable
- Check browser console for connection errors
- Ensure the backend URL starts with `https://` (not `http://`)

### CORS errors
- Verify `FRONTEND_URL` in Render matches exactly: `https://omegal-indol.vercel.app`
- Check that there are no trailing slashes in the URL
- Ensure Render service has been restarted after updating environment variables

