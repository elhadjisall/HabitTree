# Deployment Guide

This guide will help you deploy HabitTree to make it accessible to anyone on the internet.

## Quick Start: Deploy to Production

### Option 1: Railway (Backend) + Netlify (Frontend) - Recommended

#### Backend Deployment (Railway)

1. **Sign up for Railway**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your HabitTree repository

3. **Add PostgreSQL Database**
   - Click "+ New" → "Database" → "Add PostgreSQL"
   - Railway will automatically set `DATABASE_URL` environment variable

4. **Set Environment Variables**
   - Go to your service → Variables
   - Add these variables:
     ```
     SECRET_KEY=your-secret-key-here (generate a random string)
     DEBUG=False
     ALLOWED_HOSTS=*.railway.app,your-custom-domain.com
     CORS_ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
     ```

5. **Deploy**
   - Railway will automatically deploy when you push to main branch
   - Note your Railway app URL (e.g., `https://your-app.railway.app`)

#### Frontend Deployment (Netlify)

1. **Build the Frontend**
   ```bash
   npm run build
   ```

2. **Sign up for Netlify**
   - Go to https://netlify.com
   - Sign up with GitHub

3. **Deploy**
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-railway-app.railway.app/api
     ```
   - Click "Deploy site"
   - Note your Netlify URL (e.g., `https://your-app.netlify.app`)

4. **Update Backend CORS**
   - Go back to Railway
   - Update `CORS_ALLOWED_ORIGINS` to include your Netlify URL

### Option 2: Quick Testing with ngrok (Temporary)

1. **Install and Authenticate ngrok**
   ```bash
   # Already installed, just need to authenticate
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   # Get token from https://dashboard.ngrok.com/get-started/your-authtoken
   ```

2. **Start ngrok**
   ```bash
   ngrok http 5173
   ```

3. **Share the URL**
   - ngrok will give you a public URL like `https://abc123.ngrok.io`
   - Anyone can access your site at this URL
   - Note: Free tier has limitations (session timeout, random URLs)

## Environment Variables

### Backend (Railway)
- `DATABASE_URL` - Auto-set by Railway PostgreSQL
- `SECRET_KEY` - Django secret key (generate random string)
- `DEBUG` - Set to `False` for production
- `ALLOWED_HOSTS` - Your domain(s)
- `CORS_ALLOWED_ORIGINS` - Your frontend URL(s)

### Frontend (Netlify)
- `VITE_API_URL` - Your Railway backend URL + `/api`

## Custom Domain (Optional)

### Railway
1. Go to your service → Settings → Domains
2. Add your custom domain
3. Update `ALLOWED_HOSTS` environment variable

### Netlify
1. Go to Site settings → Domain management
2. Add custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### Backend Issues
- Check Railway logs: Service → Deployments → View logs
- Verify environment variables are set correctly
- Ensure PostgreSQL database is connected

### Frontend Issues
- Check Netlify build logs
- Verify `VITE_API_URL` is set correctly
- Check browser console for CORS errors

### CORS Errors
- Make sure `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Check that URLs match exactly (including https://)

## Support

For issues, check:
- Railway documentation: https://docs.railway.app
- Netlify documentation: https://docs.netlify.com

