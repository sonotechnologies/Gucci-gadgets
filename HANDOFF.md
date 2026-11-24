# Handoff: real product photos (next task)

**Status:** the site is complete and deployed (Vercel + Supabase). The last open task is replacing the generated placeholder renders in `public/products/` with real photos.

**Blocker in the previous session:** the cloud environment could not reach image hosts. A new session needs an environment that allows:

```
github.com
commons.wikimedia.org
upload.wikimedia.org
unsplash.com
images.unsplash.com
```

(with "Allow package managers" ticked).

## What to do

1. For each product in `lib/seed.ts`, find a real photo:
   - Phones and gadgets: Wikimedia Commons, which has freely licensed photos of specific models (check the licence; CC BY / CC BY-SA need attribution). Search the API: `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=<model>&format=json`.
   - Accessories and fallback: Unsplash (free licence, no attribution required).
2. Inspect every image. Then:
   - Crop to a square with the product centred.
   - Remove or neutralise busy backgrounds if possible.
   - Keep the product consistently sized.
   - Save as WebP at 1200×1200 to `public/products/<slug>-<n>.webp`, using the same names as now, so no code changes are needed.
3. If a licence requires it, record attribution in `public/products/CREDITS.md` and link it from the footer or About page.
4. Run `npx tsx scripts/gen-image-update-sql.ts` only if file names change, then run `supabase/update-images.sql` in Supabase.
5. Build, check pages at 360px and desktop in both themes, commit, and push to `main` (Vercel auto-deploys).

The fallback renders can always be regenerated with `npm run images:generate`.
