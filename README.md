# Gucci Gadgets

Pitch website for **Gucci Gadgets**, a Lagos phone store that sells new phones, UK-used phones and accessories, and offers swaps and repairs. Orders go through WhatsApp (no online payment). Built by Sono Technologies from the Design Brief, the Build Brief and the Claude Design prototypes.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Storage) · next-themes · Zustand · Zod · Vercel.

## Quick start (demo mode)

```bash
npm install
npm run dev        # http://localhost:3000
```

With no Supabase keys the site runs in **demo mode**:

- The catalogue, swap values, repair prices, settings and reviews come from `lib/seed.ts`.
- `/admin` opens without a login and shows a "Demo mode" banner. Every save is refused with a clear message.

Cart, compare, the swap estimator, repairs and WhatsApp ordering all work fully in demo mode.

## Connect Supabase (live editing)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL editor**, run `supabase/schema.sql`. It creates the tables and RLS policies (anyone can read, only a signed-in user can write) and the public `product-images` storage bucket.
3. Run `supabase/seed.sql` to load the placeholder catalogue.
4. Create the owner login in **Authentication → Users → Add user** (email and password). In **Authentication → Providers → Email**, turn off "Allow new users to sign up" so nobody else can create an account.
5. Copy `.env.example` to `.env.local` and fill in the values from **Project settings → API**:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

6. Restart `npm run dev`. `/admin` now redirects to `/admin/login`. Every edit made in admin shows on the live site straight away: server actions call `revalidatePath`, and catalogue pages also revalidate every 60 seconds.

## Deploy to Vercel

1. Import the GitHub repo in Vercel (framework preset: Next.js).
2. Add the three environment variables above. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
3. Deploy. The sitemap, robots.txt, Open Graph images and Product JSON-LD are generated automatically.

## Replacing placeholder content

| What | Where |
| --- | --- |
| Products, prices, photos | Admin → Products (or edit `lib/seed.ts`, run `npm run seed:sql`, then re-run `supabase/seed.sql`, which wipes and reloads) |
| WhatsApp number, address, hours, delivery note, Instagram | Admin → Settings (demo default: `SEED_SETTINGS` in `lib/seed.ts`) |
| Swap base values | Admin → Swap values |
| Repair prices | Admin → Repairs |
| Reviews | the `reviews` table (placeholder) |
| Map | the "map embed" placeholders on Home and About |

The **prices are rough demo values**. Check current Lagos market prices before pitching.

**Product images** are clean, logo-free renders stored in `public/products/` (3 per phone, 1 per accessory or gadget), so they always load and never depend on another site. Replace them with real photos from Admin → Products (uploads go to Supabase Storage). If any photo fails to load, the tile shows a labelled "product shot" placeholder instead of an empty box.

- Regenerate the renders: `npm run images:generate` (needs Python 3 with Pillow).
- A database seeded before the renders existed still points at old placeholder links. Run `supabase/update-images.sql` in the Supabase SQL editor; it only changes the `images` column, so your price and stock edits are kept.

All WhatsApp links read the number from settings (default `2349130928293`, Sono's demo number).

## Design decisions

- **Logo:** concept **1a, "Lens g"** (phone-outline bowl with a camera-lens dot). The SVGs are in `public/` and `components/logo.tsx`, and use `currentColor` so they follow the theme.
- **Home hero:** **1f, trust-first** (a condition report card over the featured phone).
- **Tokens:** every colour is a CSS variable in `app/globals.css` (light on `:root`, dark on `.dark`), mapped in `tailwind.config.ts`. Components never hard-code hex values.
- **Type:** Geist Sans for UI, Geist Mono with tabular numbers for prices and specs. All prices go through `formatNaira()` in `lib/format.ts`.
- **Dark mode:** next-themes with the class strategy. It follows the system on the first visit and remembers the user's choice after that.

## Swap formula (`lib/swap.ts`)

`estimate = base_value × condition multiplier − deductions`

- Multipliers: minor scratches × 0.9, dents × 0.85.
- Deductions (% of base): cracked screen −25%, battery 80–89% −5%, battery below 80% −12%, Face ID/fingerprint broken −20%, repaired before −7%.
- Customers see a range of ±5%, rounded to the nearest ₦5,000.
- Top-up = target price − estimate. If the estimate is higher, the page says "We'll pay you the difference".

## Project structure

```
app/(store)/        storefront routes: home, shop, product, deals, compare, swap, repairs, cart, about
app/admin/          login + (dash) dashboard, products, swap values, repairs, settings
components/         UI building blocks (product card, cart drawer, compare tray, swap estimator…)
lib/                data access, seed data, swap formula, WhatsApp message builders, stores
lib/admin/          admin reads, Zod schemas, server actions, image compression and upload
supabase/           schema.sql (tables, RLS, storage) and generated seed.sql
middleware.ts       protects /admin when Supabase is configured
```

## Scripts

- `npm run dev`, `npm run build`, `npm start`
- `npm run lint`, `npm run typecheck`
- `npm run seed:sql` regenerates `supabase/seed.sql` from `lib/seed.ts`

---

Built by Sono Technologies · @sonotechnologies.dev
