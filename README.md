# Nagdev Products — Plant ERP & Industrial Operations Portal

> **Industrial Castor Oil Extraction, Refining & Analytical Quality Complex**  
> Engineered in compliance with Indian & Global Industrial Standards (**IS 435: Castor Oil Specifications** / **IS 525: Castorseed for Oil Extraction** / **BIS** / **FSSAI**).

---

## 1. System Overview

**Nagdev Products Plant ERP** is a full-lifecycle Manufacturing Execution System (MES) and Enterprise Resource Planning (ERP) platform purpose-built for commercial castor seed crushing, continuous solvent extraction, chemical refining, analytical laboratory quality control, tank farm inventory strapping, and bulk logistics dispatch.

The platform provides end-to-end digital traceability from the moment raw castor seed trucks enter the weighbridge to final export-grade First Special Grade (FSG) castor oil tanker dispatch.

---

## 2. Industrial Standards & Mathematical Engines

The portal embeds real-time mathematical validation engines complying strictly with Bureau of Indian Standards (BIS):

### 2.1. IS 525: Castor Seed Inward & Quality Deduction Engine
Automates weight deductions at the weighbridge based on lab moisture and foreign matter analysis before issuing payable weight to mandi suppliers:
- **Moisture Baseline:** $\le 6.0\%$. Excess moisture deducts payable weight at a **1:1** ratio.
- **Dust & Foreign Matter Baseline:** $\le 1.0\%$. Excess foreign matter deducts payable weight at a **1:1** ratio.
- **Damaged & Weeviled Seeds Baseline:** $\le 2.0\%$. Excess damaged seeds deducts at a **1:0.5** ratio.
- **Net Payable MT Formula:**
  $$\text{Net Pay MT} = (\text{Gross MT} - \text{Tare MT}) \times \left(1 - \frac{\text{Moisture Ded} + \text{Dust Ded} + \text{Damage Ded}}{100}\right)$$

### 2.2. Mechanical Crushing Mass Balance Yield Engine
Monitors the 8 screw-press expeller batteries in real time:
- Calculates instantaneous mass balance:
  $$\text{Mass Balance Yield \%} = \frac{\text{Crude Oil Output (MT)} + \text{Expeller Cake (MT)}}{\text{Castor Seed Crushed (MT)}} \times 100$$
- **Variance Anomaly Detection:** Any deviation $|\text{Yield \%} - 100\%| > 1.5\%$ automatically triggers shop-floor supervisor alerts for unaccounted loss, moisture drop, or foots settling.

### 2.3. Chemical Refining & Solvent Extraction Plant (SEP)
- Tracks dosing of Tonsil bleaching earth and activated carbon in neutralizer/bleacher vessels.
- Maintains high vacuum conditions (28" Hg) for moisture and volatile evacuation.
- Closed-loop n-Hexane recovery and de-solventizing toaster (DTDC) monitoring for castor de-oiled meal (DOC).

### 2.4. IS 435: Castor Oil Analytical QC Grading Engine
Evaluates laboratory spectrometer and titration readings to grade every extraction batch into **First Special Grade (FSG)** or **Commercial Grade**:

| Analytical Parameter | IS 435 FSG Standard | IS 435 Commercial Grade | Re-Bleach / Reprocess Limit |
|---|---|---|---|
| **Free Fatty Acids (FFA)** | $\le 1.0\%$ | $\le 2.0\%$ | Up to $1.2\%$ (if Lovibond high) |
| **Acid Value** | $\le 2.0 \text{ mg KOH/g}$ | $\le 4.0 \text{ mg KOH/g}$ | Critical reject if $> 4.0$ |
| **Moisture & Insoluble Impurities (MIV)** | $\le 0.25\%$ | $\le 0.50\%$ | Re-evaporate under vacuum |
| **Lovibond Color (1" Cell)** | $\le 2.0\text{ Red / } 20\text{ Yellow}$ | $\le 4.0\text{ Red / } 35\text{ Yellow}$ | $2.0\text{R} - 4.0\text{R} \to$ Reprocess Bleaching |
| **Iodine Value (Wijs)** | $82 - 90$ | $82 - 90$ | Reject outside range |
| **Ricinoleic Acid Profile** | $\ge 85.0\%$ | $\ge 82.0\%$ | Critical reject if $< 82.0\%$ |

Automatically generates official, signed digital **Certificates of Analysis (COA)** with unique verification identifiers.

### 2.5. Tank Farm Physical Dip Metrology
Calculates precise volumetric mass for vertical cylindrical storage tanks (Tanks 1–10) using calibrated dip tapes:
- **Castor Oil Density Standard:** $0.959 \text{ g/cm}^3$ at $30^\circ\text{C}$.
- **Storage Mass Calculation:**
  $$\text{Stock Mass (MT)} = \frac{\pi \times R^2 \times h \times 0.959}{100}$$
  *(where $R$ is tank radius in meters and $h$ is dip tape height in centimeters).*

### 2.6. Dispatch Logistics & Security Governance
- Tanker gross/tare weighbridge integration.
- Double security seal numbering: Manhole Dome Seal & Discharge Valve Lock.
- Digital Gate Pass issuance with e-Way bill and vehicle fitness checks.

---

## 3. Architecture & Tech Stack

```
nagdev-plant-erp/
├── prisma/
│   ├── schema.prisma         # Relational schema (PostgreSQL)
│   └── seed.ts               # Production seed dataset & accounts
├── src/
│   ├── app/
│   │   ├── admin/            # Executive administration, approval queues, audit
│   │   ├── api/              # Secure REST APIs (auth, operations, QC, reports)
│   │   ├── login/            # Role-aware authentication portal
│   │   ├── portal/           # Department operator dashboards & terminals
│   │   │   └── [dept]/       # Siloed interfaces for Mandi, Expellers, Lab, etc.
│   │   ├── register/         # Employee registration (pending approval)
│   │   └── layout.tsx        # Global shell and theme
│   ├── components/           # Reusable UI widgets, badges, tables, metrics
│   ├── lib/
│   │   ├── auth.ts           # JWT authentication, session tokens & hashing
│   │   ├── calculations.ts   # IS 435 / IS 525 mathematical engine
│   │   ├── prisma.ts         # Singleton database connection
│   │   ├── types.ts          # Strongly typed domain models
│   │   └── utils.ts          # Formatting, date utilities, helpers
│   └── middleware.ts         # Edge RBAC firewall & department silo guard
├── .env.example              # Environment variables blueprint
├── next.config.ts            # Next.js optimization configuration
├── package.json              # Dependencies and scripts (postinstall prisma generate)
├── tailwind.config.ts        # Industrial dashboard design tokens
└── tsconfig.json             # TypeScript compiler configuration
```

### Core Technologies
- **Framework:** Next.js 15 (App Router, Server Components & Route Handlers)
- **Runtime & Language:** Node.js 18+ / TypeScript 5.7
- **Database & ORM:** PostgreSQL (Neon Serverless with pooling) + Prisma ORM 5.22
- **Styling:** Tailwind CSS 3.4 with custom industrial palette
- **Authentication:** Edge JWT (`jose`) with HTTP-only cookies and bcrypt password hashing
- **Reporting & Data Export:** ExcelJS for multi-sheet production ledger workbooks
- **Analytics Visualization:** Recharts for operational yields and batch trend analysis

---

## 4. Production Security & RBAC Enforcement

1. **Edge Middleware Guard:** Enforces strict Department Siloing. An operator authenticated in Expeller Crushing cannot access Mandi Weighbridge or Laboratory routes.
2. **Commercial Secret Shield:** APMC procurement purchase prices and customer sales margins are restricted to Executive Admin roles and masked from shop-floor dashboards.
3. **Approval State Machine:** Self-registered staff enter `PENDING_APPROVAL` status and cannot log in until assigned a badge and verified by the Plant Director in `/admin/users`.
4. **Mandatory Shift Handover:** Shift operators cannot log out without submitting mandatory machine handover notes, maintenance flags, and tank levels to incoming crews.

---

## 5. Seeded Production Personnel Accounts

The database seed initializes standard role accounts for plant operations:

| Department Division | Employee Name | Badge ID | Email | Default Password |
|---|---|---|---|---|
| **Executive Admin & Director** | Ramesh Nagdev | `NGD-DIR-001` | `admin@nagdev.com` | `admin123` |
| **Mandi Procurement & Weighbridge** | Kirit Patel | `NGD-MND-010` | `mandi@nagdev.com` | `password123` |
| **Mechanical Expeller Crushing** | Dinesh Sharma | `NGD-EXP-021` | `crushing@nagdev.com` | `password123` |
| **Refinery & Solvent Extraction** | Vipul Mehta | `NGD-REF-035` | `refinery@nagdev.com` | `password123` |
| **Quality Control & Analytical Lab** | Dr. Ananya Joshi | `NGD-LAB-042` | `qc@nagdev.com` | `password123` |
| **Tank Farm & Bulk Storage** | Gopal Prajapati | `NGD-TNK-055` | `tankfarm@nagdev.com` | `password123` |
| **Sales Dispatch & Logistics** | Sanjay Solanki | `NGD-DSP-063` | `dispatch@nagdev.com` | `password123` |
| **Utilities, Boilers & Maintenance** | Mahesh Rawat | `NGD-UTL-078` | `utilities@nagdev.com` | `password123` |

---

## 6. Local Setup & Production Deployment

### 6.1. Prerequisites
- **Node.js:** v18.18 or v20+ recommended
- **npm:** v9+ or **pnpm** / **yarn**
- **Git**
- **PostgreSQL Database:** Compatible with local PostgreSQL or cloud serverless providers (e.g. Neon, AWS RDS, Supabase).

### 6.2. Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hardikmali2812/nagdev-plant-erp.git
   cd nagdev-plant-erp
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to configure your database connection string and secret keys:
   ```env
   DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
   DATABASE_URL_UNPOOLED="postgresql://username:password@host/database?sslmode=require"
   JWT_SECRET="your-high-entropy-jwt-secret-string"
   NEXT_PUBLIC_APP_NAME="Nagdev Products Plant ERP"
   NEXT_PUBLIC_FACILITY="Castor Oil & Derivatives Complex - Unit 1"
   PORT=3000
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```
   *(The `postinstall` hook automatically generates the Prisma Client via `prisma generate`).*

4. **Synchronize database schema & seed initial accounts:**
   ```bash
   npx prisma db push
   npm run seed  # runs tsx prisma/seed.ts
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

### 6.3. Production Build & LAN Access

To build and run in production:
```bash
npm run build
npm run start
```

The portal listens on `0.0.0.0:3000` by default, enabling shop-floor tablets, weighbridge rugged terminals, and laboratory PCs on the plant Wi-Fi / LAN to connect directly via:
```
http://<HOST_IP_ADDRESS>:3000
```

---

## 7. License & Compliance
Proprietary software developed for **Nagdev Products**. All rights reserved.  
Conforms to BIS IS 435 (Castor Oil) and IS 525 (Castorseed for Oil Extraction) industrial specifications.
