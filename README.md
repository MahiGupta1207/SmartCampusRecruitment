# CampusHire — Smart Campus Recruitment & Placement Automation Platform

> **Production-Style University Placement Ecosystem with Automated Eligibility Verification, Live Status Pipelines, Placement Officer Intelligence, and Row Level Security.**

---

## 🌟 Overview & Key Capabilities

**CampusHire** is a full-stack, enterprise-grade Campus Placement and Recruitment Automation System engineered for universities, graduating students, and tier-1 corporate recruiters. Built strictly within a **₹0 budget** using genuinely free tools (React + Vite + Tailwind CSS + Supabase + Vercel), it streamlines the entire campus hiring lifecycle from drive publication to final selection offers.

### 🎓 1. Student Portal
- **Secure Authentication & RBAC**: Dual-role protection ensuring student users can never access administrative features.
- **Academic Profile Management**: CGPA, standing backlogs, department/branch, graduation year, verified skills, and resume link.
- **Automated Eligibility Engine**: Instant client and database-level evaluation against minimum CGPA thresholds, allowable backlogs, branch permissions, and graduation batches.
- **Job Opportunities Marketplace**: Real-time search, filters (role category, job type, package CTC, eligibility status), and one-click application submission with duplicate application prevention.
- **Live Application Pipeline**: Status milestones (`Applied` → `Under Review` → `Shortlisted` → `Interview Scheduled` → `Selected` / `Rejected`) with full timestamped history notes.
- **Selection & Offer Banners**: Instant celebratory notification with extended package details upon selection.

### 🏛️ 2. Admin / Placement Officer (T&P) Portal
- **Placement Analytics Intelligence**: Live Recharts visualizations of branch-wise placement percentages, package CTC distributions (<8 LPA, 8–15 LPA, 15–25 LPA, 25+ LPA), and application funnel.
- **Drive Lifecycle Management**: Create, edit, publish/unpublish, and close recruitment drives with customizable eligibility rules.
- **Application Review & Scheduling**: Candidate dossier evaluation, interview date scheduling, remarks recording, and 1-click status transitions.
- **Student Database & Dossier**: Search, branch filter, placed/unplaced filter, and complete student academic dossiers.
- **Corporate Recruiter Management**: Add, update, and manage company profiles, industry sectors, and HR contacts.
- **1-Click CSV Reporting**: Download verified placement records and candidate application spreadsheets directly.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Purpose & Free Tier Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + TypeScript + Vite | Blazing fast build times, strict type safety, zero hosting costs |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Responsive, accessible, premium SaaS design system |
| **Visualizations** | Recharts | Interactive SVG bar charts and pie charts for placement analytics |
| **Form Handling** | React Hook Form + Zod | Robust client validation and error prevention |
| **Database & Backend** | Supabase (PostgreSQL 15) | Free-tier managed PostgreSQL, Row Level Security, Auth |
| **Hosting & CI/CD** | Vercel | Free-tier edge deployment with automatic preview builds |
| **Version Control** | GitHub | Git repository management and Vercel GitHub integration |

---

## 🔐 Database Design & Row Level Security (RLS)

CampusHire includes full production PostgreSQL schema definitions located in [`supabase/schema.sql`](supabase/schema.sql):

- `profiles`: Extends Supabase `auth.users` with roles (`student` | `admin`).
- `student_profiles`: Academic data (branch, batch, CGPA, backlogs, resume, placed status).
- `companies`: Recruiter details, logos, sectors, websites.
- `jobs`: Job drive postings with salary brackets, deadlines, and descriptions.
- `job_eligibility`: Strict eligibility criteria per drive (min CGPA, max backlogs, branches, batches).
- `applications`: Student drive submissions with `UNIQUE(job_id, student_id)` constraint to eliminate duplicate applications.
- `application_status_history`: Audit trail of every milestone transition and recruiter note.
- **Row Level Security**:
  - Students can only view active jobs and view/update their own private applications and profile.
  - Placement officers (`is_admin()`) have authorized access across all companies, jobs, student profiles, and applicant pipelines.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js**: `v18+` or `v20+` (verified on Node `v24`)
- **npm** or **pnpm**

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd SmartCampusRecruitment

# Install dependencies
npm install
```

### 3. Environment Setup (Optional for live Supabase)
By default, the application runs seamlessly out-of-the-box in **Zero-Barrier Local Mode** populated with realistic seed data. To connect your live Supabase cloud database:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your credentials from [Supabase Dashboard](https://supabase.com):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
3. Run the schema migrations:
   - Open Supabase **SQL Editor**.
   - Copy and paste the contents of `supabase/schema.sql` and run it.
   - Run `supabase/seed.sql` to populate sample partner companies and jobs.

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Build for Production
```bash
npm run build
```

---

## 🧪 Built-in Evaluation & Demo Accounts

CampusHire features a **1-Click Quick Demo Switcher** directly on the top navigation bar and login screen:

| Role | Demo Identity | Description |
| :--- | :--- | :--- |
| **Student** | `priya.sharma@campus.edu` | High-performing CSE student with 9.15 CGPA, placed at Google India (36 LPA), active application history. |
| **Admin / T&P Officer** | `placement.officer@campus.edu` | Head of Training & Placement Cell with complete drive management and placement analytics access. |

---

## ☁️ Deployment Guide (Vercel)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete campus recruitment system"
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com) (free hobby tier).
   - Click **Add New Project** and select your GitHub repository.
   - Framework preset: **Vite**.
   - Build command: `npm run build`.
   - Output directory: `dist`.
   - (Optional) Add Environment Variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Click **Deploy**.

---

## 📄 License
MIT License. Free for educational and university campus deployment.
