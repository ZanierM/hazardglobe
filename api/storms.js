// Vercel serverless function: GET /api/storms
// Fetches GDACS, slims it down, and lets Vercel's CDN cache it for 30 minutes.
import { loadStorms } from '../lib/gdacs.js';

export default async function handler(req, res) {
  try {
    const data = await loadStorms();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json(data);
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'Could not reach GDACS', detail: String(err.message || err) });
  }
}
