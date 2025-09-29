# Quick Database Setup for AdvisorOS

Since Docker isn't available on your system, we'll use Supabase (free cloud PostgreSQL) to get the project running quickly.

## Step 1: Create Supabase Account (2 minutes)

1. **Sign up at Supabase** (browser should be open already)
   - Go to: https://supabase.com/dashboard/sign-up
   - Sign up with GitHub or email
   - Verify your email if required

## Step 2: Create New Project (1 minute)

1. **Click "New Project"** in your Supabase dashboard
2. **Fill in project details**:
   - Name: `advisoros-dev` (or any name you prefer)
   - Database Password: Create a strong password (save this!)
   - Region: Choose closest to your location
   - Pricing Plan: **Free** (perfect for development)

3. **Click "Create new project"**
   - Wait 1-2 minutes for project creation

## Step 3: Get Database Connection String

1. **Go to Project Settings** → **Database**
2. **Find "Connection string"** section
3. **Copy the "Node.js" connection string**
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with the password you created

## Step 4: Update Environment File

1. **Open** `.env` file in the AdvisorOS folder
2. **Replace the DATABASE_URL line** with your actual connection string:
   ```
   DATABASE_URL="postgresql://postgres:your-actual-password@db.xxx.supabase.co:5432/postgres"
   ```

## Step 5: Run Database Setup

Open PowerShell in the AdvisorOS folder and run:

```powershell
npm run dev:setup-db
```

This will:
- ✅ Create all database tables
- ✅ Set up the schema
- ✅ Add sample data
- ✅ Verify everything works

## Step 6: Start the Application

```powershell
npm run dev
```

The application will start at: http://localhost:3000

---

## If You Get Stuck

**Connection Issues**: Double-check your password in the DATABASE_URL
**Setup Errors**: Run `npm install` first to ensure all dependencies are installed
**Need Help**: The setup script provides detailed error messages

## What This Sets Up

- ✅ **Multi-tenant CPA platform** with organization isolation
- ✅ **Sample CPA firm** with demo clients and data
- ✅ **Authentication system** ready to use
- ✅ **Development environment** fully configured

Once running, you can explore the CPA platform features immediately!