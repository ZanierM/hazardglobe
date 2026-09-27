# Hazard Globe

A 3D globe of natural hazards for Geography lessons.

**Live now**
- Tropical storms from [GDACS](https://www.gdacs.org), which merges NOAA, JTWC and other agencies' warnings for every ocean basin. Shows tracks, forecast cones and Saffir-Simpson category.
- Earthquakes of magnitude 4.5+ from the past week, from the [USGS](https://earthquake.usgs.gov) live feed. Coloured by depth and sized by magnitude.
- Plate boundaries coloured constructive, destructive, collision or conservative (Bird 2003, PB2002).
- Day and night, sea surface temperature and satellite layers from NASA GIBS.

**Case studies**
- Tropical storm replays using real NOAA IBTrACS best-track data: Katrina, Sandy, Maria, Irma, Andrew, Haiyan, Idai and Nargis.
- Earthquake replays showing the main shock, then the aftershocks appearing over 30 days (USGS catalogue): Indian Ocean 2004, Haiti, Chile, Christchurch, Tōhoku, Nepal, L'Aquila and Turkey–Syria.
- Volcanoes: Mount St Helens, Pinatubo, Montserrat, Eyjafjallajökull, Nyiragongo and Hunga Tonga.
- Each case study has key facts, discussion questions and source links. Figures are rounded, widely cited estimates, so check them against your exam board's case study materials.

## Deploy to Vercel

GDACS doesn't let other websites read its data directly from a browser. The small function `api/storms.js` fetches it on the server and caches it for 30 minutes. The USGS feed and the case-study data load directly in the browser.

1. Create a GitHub repo and upload this folder's contents.
2. In Vercel, go to **Add New → Project → Import** and choose that repo. There's no build step, so leave the settings at their defaults.
3. Deploy.

To test on your own computer, run `npx vercel dev` and open http://localhost:3000. If you open `index.html` straight from disk, nothing will load.

## Files

| File | What it does |
|---|---|
| `index.html` | The globe, lists, cards, replay player and controls |
| `lib/gdacs.js` | Converts GDACS data into storm categories, basins, tracks and cones |
| `api/storms.js` | The Vercel function that serves `/api/storms` |
| `data/casestudies.json` | Case study tracks, aftershock sequences, facts and links |
| `data/plates.json` | Plate boundaries by type |

## Adding a case study

Add an entry to `data/casestudies.json`. Storm tracks are rows of `[time, lat, lon, wind_kt, pressure_hPa, over_land]`. Earthquake sequences are rows of `[minutes_after_main_shock, lat, lon, magnitude, depth_km]`.
