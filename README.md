# Casino App

A Node.js casino application with WebSocket support.

## Deployment to Vercel

This app is configured for Vercel deployment. The following files have been set up:

- `vercel.json` - Vercel configuration
- `package.json` - Updated with proper scripts
- `.gitignore` - Excludes unnecessary files

## To Deploy:

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Environment Variables

The app currently uses hardcoded values for testing. For production, consider moving sensitive data to environment variables.

## Features

- Express.js server
- WebSocket support
- MongoDB integration
- Session management
- Multiple game routes 