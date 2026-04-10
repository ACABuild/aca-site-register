# ACA Build Site Register – Setup Guide

## What this app does
- Trades scan a QR code at the site entrance
- They fill in a 5-step mobile form: personal details → site induction → upload licence & insurance → upload work photos (auto-timestamped) → confirmation
- You see everything in the admin dashboard: who's on site, compliance status, documents, photos

---

## Step 1 — Set up Supabase (free, takes 5 minutes)

1. Go to **https://supabase.com** and create a free account
2. Click **New Project**, name it `aca-site-register`, choose a region (Australia East)
3. Set a database password (save it) and click **Create**
4. Once created, go to **SQL Editor** → **New Query**
5. Paste the entire contents of `supabase/schema.sql` and click **Run**
6. Go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → this is your `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Deploy to Vercel (free, takes 5 minutes)

1. Go to **https://github.com** and create a new repository called `aca-site-register`
2. Upload all these files to the repository (drag & drop or use GitHub Desktop)
3. Go to **https://vercel.com**, sign in with GitHub
4. Click **New Project** → Import your `aca-site-register` repo
5. Under **Environment Variables**, add these:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | From Supabase Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Settings → API (secret) |
   | `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. `https://aca-site-register.vercel.app`) |
   | `ADMIN_PASSWORD` | Choose a strong password for your admin login |

6. Click **Deploy** — Vercel builds and deploys automatically

---

## Step 3 — Create your first job

1. Go to `https://your-app.vercel.app/admin`
2. Log in with the `ADMIN_PASSWORD` you set
3. Click **New Job** and fill in the job number, client name, and address
4. Click the **Download QR Poster** button — a print-ready PNG is downloaded
5. Print it and stick it at the front of the site

---

## Step 4 — Trades sign in

When a tradesman scans the QR code with their phone camera, they are taken to the sign-in page for that job. They:
1. Fill in their name, company, trade type, phone, licence number, ABN
2. Tick through the site induction checklist
3. Upload their trade licence and insurance (photo or PDF)
4. Upload photos of their work (timestamps recorded automatically)
5. Get a confirmation screen — they can sign out when they leave

---

## Admin dashboard features

- **Dashboard** — all active jobs + who's on site right now
- **Job detail** — QR code, complete trade register, compliance status per person
- **Compliance badges** — Green (licence + insurance uploaded), Yellow (partial), Red (missing docs)
- **Induction tracker** — see which checklist items each trade acknowledged
- **Document viewer** — click any document to open/download
- **Photo gallery** — all work photos with timestamps and trade names
- **Job status** — mark jobs as Active / Completed / Archived

---

## Running locally (for testing)

```bash
# 1. Copy the example env file
cp .env.local.example .env.local
# 2. Fill in your Supabase keys in .env.local
# 3. Install and run
npm install
npm run dev
# App runs at http://localhost:3000
```

---

## Need help?
Contact: admin@acabuild.com.au
