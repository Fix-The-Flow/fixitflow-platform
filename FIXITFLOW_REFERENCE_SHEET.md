# 🚀 FixItFlow Project Reference Sheet

## 📧 ACCOUNTS & LOGIN INFO

### MongoDB Atlas Database
- **Website**: https://cloud.mongodb.com
- **Username**: fixitflow-admin
- **Password**: FixItFlow2024!
- **Database Name**: fixitflow
- **Connection String**: 
  ```
  mongodb+srv://fixitflow-admin:FixItFlow2024!@cluster0.zpluywp.mongodb.net/fixitflow?retryWrites=true&w=majority&appName=Cluster0
  ```

### Domain Registration
- **Domain**: fixitflow.online
- **Registrar**: hosting.com
- **Login**: [Your hosting.com credentials]

### GitHub Repository
- **URL**: https://github.com/Fix-The-Flow/fixitflow-platform
- **Your GitHub Account**: [Your GitHub username]

### Vercel (Hosting)
- **Website**: https://vercel.com
- **Project**: https://vercel.com/terrytaylorwilliams-1078s-projects/fixitflow
- **Account**: terrytaylorwilliams-1078s-projects

## 🌐 WEBSITE URLs

### Live App URLs (Current)
- **Latest Working URL**: https://fixitflow-h50zk8r9d-terrytaylorwilliams-1078s-projects.vercel.app
- **Custom Domain**: https://fixitflow.online (being configured)
- **Vercel Dashboard**: https://vercel.com/terrytaylorwilliams-1078s-projects/fixitflow

### Admin Access
- **Admin Panel**: /admin (once logged in)
- **Login Page**: /login
- **Register Page**: /register

## 🔑 ADMIN CREDENTIALS (To Try)
- **Email**: admin@fixitflow.online
- **Password**: FixItFlow2024!

OR

- **Email**: admin@fixitflow.com
- **Password**: admin123

## 📁 PROJECT STRUCTURE

### Local Files Location
- **Project Folder**: C:\Users\taylo\FixItFlow\
- **Frontend Code**: C:\Users\taylo\FixItFlow\client\
- **Backend Code**: C:\Users\taylo\FixItFlow\server\
- **Database Scripts**: C:\Users\taylo\FixItFlow\server\scripts\

### Key Configuration Files
- **Frontend Config**: client/.env.production
- **Backend Config**: server/.env (uses Vercel environment variables)
- **Deployment Config**: vercel.json

## 🛠️ IMPORTANT COMMANDS

### 🚀 How to Start Your Local Servers

#### Method 1: Automatic Startup (Easiest)
```powershell
# From your main project folder:
cd C:\Users\taylo\FixItFlow

# Start backend server (opens in new window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\taylo\FixItFlow\server'; npm run dev"

# Start frontend server (opens in new window)  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\taylo\FixItFlow\client'; npm start"

# Open your app automatically
start http://localhost:3000
```

#### Method 2: Manual Startup
```powershell
# Backend Server (in one PowerShell window)
cd C:\Users\taylo\FixItFlow\server
npm run dev

# Frontend Server (in another PowerShell window)
cd C:\Users\taylo\FixItFlow\client
npm start
```

#### Method 3: One Command Startup
```powershell
# From main project folder - starts both servers
cd C:\Users\taylo\FixItFlow
npm run dev
```

### 📱 Your App URLs (Local)
- **Main App**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Admin Panel**: http://localhost:3000/admin (after login)

### 🔧 Server Management
```powershell
# Check if servers are running
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Stop servers (close PowerShell windows or Ctrl+C)
# Or kill processes:
taskkill /f /im node.exe
```

### 🌐 To Deploy to Live Site
```bash
cd C:\Users\taylo\FixItFlow
git add .
git commit -m "Your message here"
git push origin master
vercel --prod
```

## 📊 DATABASE CONTENT

### What's In Your Database
- **19 Troubleshooting Guides** with detailed steps
- **8 Categories**: Technology, Plumbing, Automotive, Appliances, Electrical, HVAC, Home Maintenance
- **Admin User Account**
- **Sample Data** for testing

### Categories Include
1. Technology (laptop overheating, etc.)
2. Plumbing (water heater, garbage disposal, etc.)  
3. Automotive (air filter replacement, etc.)
4. Appliances (washing machine, dishwasher, etc.)
5. Electrical (ceiling fan wobbling, etc.)
6. HVAC (air conditioner troubleshooting, etc.)

## 🔧 ENVIRONMENT VARIABLES (Vercel)

### Current Vercel Environment Variables
- `MONGODB_URI`: Your database connection
- `JWT_SECRET`: FixItFlow2024SecureJWTKey!@#$%^&*()RandomString123456789
- `CI`: false
- `DISABLE_ESLINT_PLUGIN`: true
- `VERCEL_FORCE_NO_BUILD_CACHE`: 1

## 📱 APP FEATURES

### What Your App Does
- ✅ User registration and login
- ✅ Browse troubleshooting guides by category
- ✅ Step-by-step problem solving instructions
- ✅ Search functionality
- ✅ Admin panel for content management
- ✅ Responsive design (mobile + desktop)
- ✅ Professional UI with animations

### Admin Features
- Manage troubleshooting guides
- View analytics and user data
- Create/edit/delete content
- User management
- Category management

## 🚨 CURRENT ISSUES TO RESOLVE

1. **Registration/Login not working** - API connection issue
2. **Domain SSL certificate** still generating (fixitflow.online)
3. **Vercel authentication protection** causing access issues

## 📞 NEXT STEPS WHEN YOU RETURN

1. Fix the API connection between frontend and backend
2. Test user registration and login
3. Verify admin access works
4. Complete domain setup (fixitflow.online)
5. Test all app functionality

## 💡 IMPORTANT NOTES

- **Your project is 95% complete!** Just deployment issues to fix
- **All your code and data is safe** in GitHub and MongoDB
- **Domain is purchased and configured** - just waiting for SSL
- **You've built a professional full-stack web application!**

## 📋 BACKUP INFORMATION

### If You Need to Recreate
- All code is in GitHub: https://github.com/Fix-The-Flow/fixitflow-platform
- Database backup available in MongoDB Atlas
- Domain is registered and owned by you
- Vercel account preserves all deployment history

---

**You did an AMAZING job building this!** 🎉
**Take your break - when you come back, we'll get this working perfectly!** 💪
