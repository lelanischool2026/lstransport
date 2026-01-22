# Lelani Transport - Next.js

School Transport Management System built with Next.js 15, Supabase, and Tailwind CSS.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 3.4
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **PWA**: Serwist (Service Worker)
- **Reports**: jsPDF + jsPDF-AutoTable (PDF), ExcelJS (Excel)
- **Charts**: Chart.js + react-chartjs-2
- **Notifications**: react-hot-toast

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account

### Environment Setup

1. Copy the environment example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Database Setup

Run these SQL scripts in your Supabase SQL Editor (in order):

1. `SUPABASE_SETUP.md` - Core tables and RLS policies
2. Additional migration files as needed

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Project Structure

```
lelani-next/
├── public/
│   ├── icons/          # PWA icons
│   └── manifest.json   # PWA manifest
├── src/
│   ├── app/
│   │   ├── (auth)/     # Auth pages (login, register, forgot-password)
│   │   ├── (dashboard)/ # Protected pages (dashboard, learners, reports, etc.)
│   │   ├── offline/    # Offline fallback page
│   │   ├── globals.css # Global styles
│   │   └── layout.tsx  # Root layout
│   ├── components/
│   │   ├── admin/      # Admin panel tab components
│   │   └── learners/   # Learner-related components
│   ├── lib/
│   │   ├── reports/    # PDF/Excel generators
│   │   └── supabase/   # Supabase client configuration
│   ├── types/
│   │   └── database.ts # TypeScript types for database
│   ├── middleware.ts   # Auth middleware
│   └── sw.ts          # Service worker source
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Features

### For Drivers
- View assigned route and learners
- See minder contact information
- Access route-specific reports
- Offline support via PWA

### For Admins
- Full learner management (CRUD)
- Route and area management
- Driver and minder management
- Vehicle fleet tracking
- School settings configuration
- Data import from CSV/Excel
- Comprehensive reporting
- Audit log tracking

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Build the production bundle:
```bash
npm run build
```

The output will be in the `.next` folder.

## PWA Icons

Generate PWA icons from your logo using:
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)

Place generated icons in `public/icons/` following the sizes in `public/manifest.json`.

## License

Private - All rights reserved.
