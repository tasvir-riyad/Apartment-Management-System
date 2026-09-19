# 🏢 Apartment Management System 

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Neon-336791?style=flat&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

A modern, production-grade, full-stack **Apartment and Property Management System** tailored for residential and multi-tenant buildings. Developed specifically for **সাঈদী টাওয়ার (Sayedi Tower)** in Boaliarkul, Lohagara, Chattogram, Bangladesh.

---

## 🌟 Key Features

### 1. 🏠 Public TO LET & Building Showcase
- Styled with the building's authentic signboard branding (Deep Royal Navy `#1E3A8A`).
- Live display of available/vacant flats with real-time room configurations, rent, and amenities.
- Quick direct contact links (Click-to-Call, WhatsApp direct chat, and embedded Google Maps location).

### 2. 🎛️ Comprehensive Admin Dashboard
- **Live Occupancy & Financial Overview:** Instant statistics on occupied vs. vacant units, expected monthly collections, and total outstanding dues.
- **High-Due Alert System:** Visual alert banner triggering for flats exceeding high dues (e.g. ৳30,000 threshold).
- **Interactive Floor Stack View:** Visual 8-level building elevation (from Ground Floor parking up to Rooftop) with real-time occupancy and payment color indicators.

### 3. 🛗 Dedicated Lift (Elevator) Management
- Supports custom monthly lift fees configurable per flat by the management.
- Initial default is set to `৳0` and can be adjusted anytime.
- Automatic billing separation: monthly tenant ledger distinctly itemizes **Base Rent** and **Lift Charge**.

### 4. 💳 Rent Billing, Invoicing & Receipts
- Automated monthly bill generation with partial payment support, balance roll-forward, and advance deduction.
- **Printable Money Receipts (মানি রসিদ):** High-resolution, professional receipts with printable styling, breakdown of charges, and automated Bengali in-words conversion (কথায় টাকা).

### 5. 👥 Resident / Tenant Portal
- Frictionless login using flat code (e.g., `B2`, `C1`, `D2`).
- Real-time ledger view: rent breakdown, lift charges, extra utility bills, payment history, and downloadable PDF receipts.
- Payment notice submission and digital maintenance requests.

### 6. 🌐 Seamless Bilingual Support
- Built-in dynamic language switcher for **বাংলা (Bengali)** and **English**.
- Bengali typography powered by `Hind Siliguri` and English powered by `Inter`.

---

## 🏢 Building Architecture (Sayedi Tower)

| Detail | Specification |
|---|---|
| **Location** | Chowdhury Road, Boaliarkul, Lohagara, Chattogram, Bangladesh |
| **Total Floors** | 8 Levels (Level 1: Ground Floor & Parking; Levels 2–7: Residential; Level 8: Rooftop) |
| **Total Units** | 20 Units (19 Rentable Flats + 1 Owner Residence `E2-E3`) |
| **Full Rent Roll** | ৳192,500 / month |
| **Default Due Date**| 9th of every calendar month |
| **High Due Alert** | ৳30,000 threshold |
| **Google Maps** | [Sayedi Tower on Google Maps](https://maps.app.goo.gl/e58HCKi4UTQQ5Je78?g_st=iw) |

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Lucide React Icons, Custom Glassmorphic Styles
- **Backend:** Next.js Server Routes & API Handlers
- **Database & ORM:** PostgreSQL (Neon Serverless) / SQLite with Prisma ORM
- **Authentication:** Stateless JWT Sessions with Bcrypt (Salt rounds: 12)
- **Document Generation:** html2pdf.js / html-to-image for digital receipts

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.18 or higher recommended)
- `npm` or `yarn` or `pnpm`
- A PostgreSQL database instance (e.g., [Neon](https://neon.tech/)) or local PostgreSQL/SQLite.

### 1. Clone the Repository
```bash
git clone https://github.com/tasvir-riyad/Apartment-Management-System.git
cd Apartment-Management-System
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the sample environment file to create your `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your database URL and secrets:
```env
# Neon PostgreSQL connection string
DATABASE_URL="postgresql://username:password@your-neon-host.neon.tech/neondb?sslmode=require"

# JWT Authentication Secret
JWT_SECRET="your_secure_jwt_secret_key_here"

# Cron secret for automated billing tasks
CRON_SECRET="your_cron_secret_token_here"

# Application Title
NEXT_PUBLIC_APP_NAME="Sayedi Tower"
```

> **Note:** `.env` and `node_modules` are excluded from version control via `.gitignore`. Never commit your live credentials!

### 4. Setup the Database
Push the Prisma schema to create the tables in your PostgreSQL database:
```bash
npx prisma db push
```

Generate the Prisma Client:
```bash
npx prisma generate
```

### 5. Seed Initial Data
Seed the building floors, flats, lift fee configurations, default users, and sample tenants:
```bash
npm run seed
```

### 6. Run Automated Ledger Tests
Verify financial calculations, billing, and lift fees:
```bash
npx tsx test/ledger.test.ts
```

### 7. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Credentials

| Role | Username / Flat Code | Password | Access URL |
|---|---|---|---|
| **Super Admin** | `admin@sayeditower.com` | `admin123` | `/login` → `/admin` |
| **Manager / Owner** | `owner` | `owner123` | `/login` → `/admin` |
| **Tenant (Flat B2)** | `B2` | `tenant123` | `/login` → `/tenant` |
| **Tenant (Flat C1)** | `C1` | `tenant123` | `/login` → `/tenant` |
| **Tenant (Flat A1)** | `A1` | `tenant123` | `/login` → `/tenant` |
| **Tenant (Flat D1)** | `D1` | `tenant123` | `/login` → `/tenant` |

---

## 📁 Project Structure

```
├── app/
│   ├── admin/             # Management portal (Dashboard, Flats, Tenants, Rent Roll, Lift)
│   ├── api/               # Next.js API route handlers (Auth, Bills, Dues, Charges, etc.)
│   ├── login/             # Universal role-based login page
│   ├── receipt/           # Printable money receipt viewer
│   ├── tenant/            # Resident self-service portal
│   ├── globals.css        # Global CSS with print & custom theme utilities
│   ├── layout.tsx         # Root layout with bilingual provider
│   └── page.tsx           # Public TO LET landing page
├── components/            # Reusable UI widgets, badges, navigation bars, modals
├── contexts/              # LanguageContext for Bengali/English toggle
├── lib/                   # Database client (Prisma), auth helpers, currency formatters
├── prisma/
│   ├── schema.prisma      # Prisma schema for PostgreSQL
│   └── seed.ts            # Seed script for Sayedi Tower building data
├── public/                # Static assets and images
├── test/                  # Automated integration and ledger tests
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules (node_modules, .env, builds excluded)
└── README.md              # Project documentation
```

---

## 📄 License & Ownership

Designed and maintained for **Sayedi Tower (সাঈদী টাওয়ার)**. All rights reserved.
