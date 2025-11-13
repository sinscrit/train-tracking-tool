# Railway Deployment Guide

## Train Service Tracking Tool

This document provides comprehensive instructions for deploying the Train Service Tracking Tool to Railway, a modern platform-as-a-service that simplifies application deployment and hosting.

---

## Overview


**Technology Stack:**
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Server**: Express.js (serves static files in production)
- **Package Manager**: pnpm

---

## Prerequisites

Before deploying to Railway, ensure you have the following:

1. **Railway Account**: Sign up at [railway.app](https://railway.app) if you haven't already
2. **GitHub Account**: Railway integrates seamlessly with GitHub for automatic deployments
3. **Git Repository**: Your project code should be pushed to a GitHub repository
4. **Railway CLI** (optional): Install via `npm install -g @railway/cli` for command-line deployments

---

## Deployment Configuration Files

The following configuration files have been created to optimize Railway deployment:

### 1. `railway.json`

Defines the build and deployment configuration for Railway:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm run build"
  },
  "deploy": {
    "startCommand": "pnpm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Key Features:**
- Uses Nixpacks builder for optimal Node.js environment setup
- Installs dependencies with pnpm for faster, more efficient builds
- Configures automatic restart on failure with up to 10 retry attempts

### 2. `nixpacks.toml`

Specifies the exact build environment and commands:

```toml
[phases.setup]
nixPkgs = ["nodejs_22", "pnpm"]

[phases.install]
cmds = ["pnpm install --frozen-lockfile"]

[phases.build]
cmds = ["pnpm run build"]

[start]
cmd = "pnpm run start"
```

**Benefits:**
- Ensures Node.js 22 and pnpm are available in the build environment
- Uses frozen lockfile to guarantee reproducible builds
- Clearly separates install, build, and start phases

### 3. `Procfile`

Defines the process type for Railway:

```
web: pnpm run start
```

### 4. `.railwayignore`

Excludes unnecessary files from deployment to reduce build size and improve performance:

- Development files and documentation
- Test files and screenshots
- IDE configuration files
- Temporary files and logs

---

## Deployment Methods

### Method 1: Deploy via Railway Dashboard (Recommended)

This is the easiest method for first-time deployments:

**Step 1: Push Code to GitHub**

Ensure your project is pushed to a GitHub repository:

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

**Step 2: Create New Project on Railway**

1. Log in to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account if prompted
5. Select your repository from the list

**Step 3: Configure Deployment**

Railway will automatically detect the configuration files and set up the deployment:

1. Railway reads `railway.json` and `nixpacks.toml`
2. The build process starts automatically
3. Once complete, Railway assigns a public URL

**Step 4: Access Your Application**

After deployment completes (typically 2-5 minutes):

1. Click on your project in the Railway dashboard
2. Navigate to the **"Deployments"** tab
3. Click on the generated URL to access your application

---

### Method 2: Deploy via Railway CLI

For developers who prefer command-line workflows:

**Step 1: Install Railway CLI**

```bash
npm install -g @railway/cli
```

**Step 2: Login to Railway**

```bash
railway login
```

This opens a browser window for authentication.

**Step 3: Initialize Railway Project**

Navigate to your project directory:

```bash
cd /path/to/train-tracking-tool
railway init
```

Follow the prompts to create a new project or link to an existing one.

**Step 4: Deploy**

```bash
railway up
```

The CLI will:
- Upload your project files
- Trigger the build process
- Deploy the application
- Display the deployment URL

**Step 5: Monitor Deployment**

View real-time logs:

```bash
railway logs
```

---

## Environment Variables

The application currently runs without requiring custom environment variables. However, if you need to configure environment variables in the future:

**Via Railway Dashboard:**

1. Navigate to your project
2. Click on the **"Variables"** tab
3. Add key-value pairs as needed
4. Click **"Deploy"** to apply changes

**Via Railway CLI:**

```bash
railway variables set KEY=VALUE
```

**Common Variables (for future use):**

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (Railway sets automatically) | `3000` |
| `NODE_ENV` | Node environment | `production` |

---

## Build Process

The deployment follows this sequence:

1. **Setup Phase**: Railway provisions Node.js 22 and pnpm
2. **Install Phase**: Dependencies are installed via `pnpm install --frozen-lockfile`
3. **Build Phase**: 
   - Vite builds the React application → `dist/public/`
   - esbuild compiles the Express server → `dist/index.js`
4. **Start Phase**: Express server starts and serves static files from `dist/public/`

**Build Output:**
- Client bundle: ~706 KB JavaScript + ~118 KB CSS (gzipped: ~186 KB + ~18 KB)
- Server bundle: ~788 bytes
- Total build time: ~5-10 seconds

---

## Custom Domain Configuration

To use a custom domain instead of the Railway-generated URL:

**Step 1: Add Domain in Railway**

1. Go to your project settings
2. Navigate to **"Domains"** section
3. Click **"Add Domain"**
4. Enter your custom domain (e.g., `trains.yourdomain.com`)

**Step 2: Configure DNS**

Add a CNAME record in your domain registrar's DNS settings:

| Type | Name | Value |
|------|------|-------|
| CNAME | trains | `your-project.up.railway.app` |

**Step 3: Wait for Propagation**

DNS changes typically propagate within 5-30 minutes. Railway will automatically provision an SSL certificate via Let's Encrypt.

---

## Monitoring and Maintenance

### View Logs

**Via Dashboard:**
1. Navigate to your project
2. Click on **"Deployments"**
3. Select a deployment to view logs

**Via CLI:**
```bash
railway logs
```

### Monitor Performance

Railway provides built-in metrics:
- CPU usage
- Memory consumption
- Network traffic
- Request count

Access these via the **"Metrics"** tab in your project dashboard.

### Automatic Deployments

Railway automatically redeploys your application when you push changes to the connected GitHub branch:

1. Make changes to your code
2. Commit and push to GitHub
3. Railway detects the changes and triggers a new deployment
4. Zero-downtime deployment ensures continuous availability

---

## Troubleshooting

### Build Fails

**Issue**: Build process fails with dependency errors

**Solution**:
1. Verify `pnpm-lock.yaml` is committed to your repository
2. Check that all dependencies in `package.json` are correctly specified
3. Review build logs in Railway dashboard for specific error messages

### Application Won't Start

**Issue**: Build succeeds but application fails to start

**Solution**:
1. Verify the start command in `railway.json` matches your `package.json` scripts
2. Check that `dist/index.js` exists after build
3. Ensure Express server is configured to use `process.env.PORT`

### 404 Errors on Client-Side Routes

**Issue**: Direct navigation to routes like `/calendar` returns 404

**Solution**: The Express server is already configured to handle client-side routing by serving `index.html` for all routes. If you still encounter issues:

1. Verify `server/index.ts` contains the catch-all route handler
2. Rebuild the application: `pnpm run build`
3. Test locally with `pnpm run start`

### Slow Build Times

**Issue**: Builds take longer than expected

**Solution**:
1. Ensure `.railwayignore` is properly configured to exclude `node_modules`
2. Consider enabling Railway's build cache (enabled by default)
3. Review Vite configuration for optimization opportunities

---

## Scaling and Performance

### Vertical Scaling

Railway allows you to adjust resources allocated to your application:

1. Navigate to project settings
2. Select **"Resources"** tab
3. Adjust CPU and memory allocation
4. Click **"Save"**

**Recommended Settings:**
- **CPU**: 1 vCPU (sufficient for most traffic)
- **Memory**: 512 MB - 1 GB (depending on traffic volume)

### Horizontal Scaling

For high-traffic scenarios, consider:

1. Enabling Railway's autoscaling features
2. Using a CDN (Cloudflare, Fastly) to cache static assets
3. Implementing Redis for session management if needed

---

## Cost Estimation

Railway pricing is based on resource usage:

- **Free Tier**: $5 credit per month (suitable for development/testing)
- **Hobby Plan**: $5/month + usage-based pricing
- **Pro Plan**: $20/month + usage-based pricing

**Estimated Monthly Cost for This Application:**
- Low traffic (< 10,000 requests/month): **Free tier sufficient**
- Medium traffic (10,000 - 100,000 requests/month): **$5-15/month**
- High traffic (> 100,000 requests/month): **$15-50/month**

---

## Security Best Practices

1. **HTTPS**: Railway automatically provisions SSL certificates for all deployments
2. **Environment Variables**: Never commit sensitive data to your repository
3. **Dependencies**: Regularly update dependencies to patch security vulnerabilities
4. **Access Control**: Use Railway's team features to manage deployment permissions

---

## Rollback Procedure

If a deployment introduces issues:

**Via Dashboard:**
1. Navigate to **"Deployments"** tab
2. Find the last known good deployment
3. Click **"Redeploy"**

**Via CLI:**
```bash
railway rollback
```

Railway maintains a history of all deployments, allowing instant rollback to any previous version.

---

## Additional Resources

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Community**: [Discord](https://discord.gg/railway)
- **Vite Deployment Guide**: [vitejs.dev/guide/static-deploy](https://vitejs.dev/guide/static-deploy.html)
- **Express Production Best Practices**: [expressjs.com/en/advanced/best-practice-performance.html](https://expressjs.com/en/advanced/best-practice-performance.html)

---

## Support

For deployment issues or questions:

1. **Railway Support**: Available via dashboard chat or Discord
2. **Project Documentation**: Review `FEATURES.md`, `ARCHITECTURE.md`, and other docs in the repository
3. **GitHub Issues**: Report bugs or request features in your repository's issue tracker

---

## Conclusion

Your Train Service Tracking Tool is now fully configured for Railway deployment. The provided configuration files ensure optimal build performance, automatic restarts, and seamless integration with Railway's infrastructure. Follow the deployment methods outlined above to get your application online within minutes.

**Next Steps After Deployment:**
1. Test all features in the production environment
2. Configure a custom domain if desired
3. Set up monitoring and alerts
4. Share the application URL with your team

---

*Document prepared by Manus AI*  
*Last updated: November 12, 2025*
