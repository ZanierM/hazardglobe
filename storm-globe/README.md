# Storm Globe

Live tropical storms on a 3D globe, built for Geography lessons.

- **Data:** [GDACS](https://www.gdacs.org) (EU JRC / UN OCHA), which merges NOAA, JTWC and other agencies' warnings for every ocean basin.
- **Imagery:** NASA GIBS (Blue Marble, sea surface temperature, yesterday's satellite view).
- **Map:** MapLibre GL (globe projection).

## Deploy to Vercel (about 5 minutes)

GDACS doesn't allow other websites to read its data directly from a browser, so the small function `api/storms.js` fetches it on the server, trims it from several MB down to a few KB, and caches it for 30 minutes.

1. Create a new GitHub repo (e.g. `storm-globe`) and upload this folder's contents.
2. In Vercel: **Add New → Project → Import** that repo. There's no build step, so leave the settings at their defaults.
3. Deploy. The site is live at `https://<project>.vercel.app`.

To test locally: `npx vercel dev`, then open http://localhost:3000.
Opening `index.html` directly from disk won't load storms, because the page needs `/api/storms`.

## Files

| File | What it does |
|---|---|
| `index.html` | The globe, storm list, storm card and controls |
| `lib/gdacs.js` | Converts GDACS data into categories, basins, tracks and forecast cones |
| `api/storms.js` | The Vercel function that serves `/api/storms` |

## Ideas for version 2

- Case study mode: replay historical storms (Katrina, Haiyan, Idai) from NOAA IBTrACS
- A season tally per basin
- A 26.5°C sea temperature contour line
