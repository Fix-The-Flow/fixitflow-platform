# FixItFlow Complete Deployment Setup

## Current Status ✅
- Frontend deployed: https://client-qbm65nq4k-terrytaylorwilliams-1078s-projects.vercel.app
- Backend deployed: https://server-45q8xf622-terrytaylorwilliams-1078s-projects.vercel.app
- Code updated and CORS configured

## Step 1: Set Environment Variables for Backend

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to: https://vercel.com/dashboard
2. Click on your "server" project
3. Go to Settings → Environment Variables
4. Add these variables:

```
MONGODB_URI = mongodb+srv://taylorbostic93_db_user:HDtFmWIBAW1nRFuN@cluster0.zpluywp.mongodb.net/fixitflow?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET = fixitflow_jwt_secret_demo_key_12345
NODE_ENV = production
CLIENT_URL = https://client-qbm65nq4k-terrytaylorwilliams-1078s-projects.vercel.app
PORT = 5000
```

**Option B: Via CLI (if you prefer)**
Run these commands in your server directory:

```powershell
vercel env add MONGODB_URI production
# Enter: mongodb+srv://taylorbostic93_db_user:HDtFmWIBAW1nRFuN@cluster0.zpluywp.mongodb.net/fixitflow?retryWrites=true&w=majority&appName=Cluster0

vercel env add JWT_SECRET production
# Enter: fixitflow_jwt_secret_demo_key_12345

vercel env add NODE_ENV production
# Enter: production

vercel env add CLIENT_URL production
# Enter: https://client-qbm65nq4k-terrytaylorwilliams-1078s-projects.vercel.app
```

## Step 2: Connect Your Domain

1. Go to your frontend project in Vercel dashboard
2. Go to Settings → Domains
3. Add domain: `fixitflow.online`
4. Add domain: `www.fixitflow.online`
5. Follow Vercel's DNS instructions

**DNS Settings at your domain registrar:**
- Add CNAME record: `www` → `cname.vercel-dns.com`
- Add A record: `@` → `76.76.21.21`
- Or update nameservers to Vercel's if provided

## Step 3: Test the Deployment

After setting environment variables and domain:
1. Visit: https://fixitflow.online (once DNS propagates)
2. Test login with: admin@fixitflow.com / admin123
3. Access admin dashboard at: https://fixitflow.online/admin

## Troubleshooting

If you encounter issues:
1. Check Vercel function logs in the dashboard
2. Verify environment variables are set correctly
3. Ensure MongoDB connection string is accurate
4. DNS propagation can take up to 24-48 hours

## Current URLs
- Frontend: https://client-qbm65nq4k-terrytaylorwilliams-1078s-projects.vercel.app
- Backend: https://server-45q8xf622-terrytaylorwilliams-1078s-projects.vercel.app
- Target Domain: https://fixitflow.online
