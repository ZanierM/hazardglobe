// Shared GDACS processing: turns the raw (very large) GDACS feeds into a small,
// classroom-friendly JSON. Used by the Vercel function (api/storms.js) and, as a
// fallback, directly in the browser when the page can reach GDACS itself.

const LIST_URL =
  'https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP?eventtype=TC';

// Saffir-Simpson from 1-minute sustained wind in km/h
export function category(kmh) {
  if (kmh >= 252) return { code: 'C5', label: 'Category 5', short: '5' };
  if (kmh >= 209) return { code: 'C4', label: 'Category 4', short: '4' };
  if (kmh >= 178) return { code: 'C3', label: 'Category 3', short: '3' };
  if (kmh >= 154) return { code: 'C2', label: 'Category 2', short: '2' };
  if (kmh >= 119) return { code: 'C1', label: 'Category 1', short: '1' };
  if (kmh >= 63) return { code: 'TS', label: 'Tropical storm', short: 'TS' };
  return { code: 'TD', label: 'Tropical depression', short: 'TD' };
}

// Ocean basin + the local name for the same kind of storm
export function basin(lon, lat) {
  if (lat >= 0) {
    if (lon >= 100) return { name: 'North-West Pacific', term: 'typhoon' };
    if (lon >= 40 && lon < 100) return { name: 'North Indian Ocean', term: 'cyclone' };
    if (lon >= -180 && lon < -140) return { name: 'Central Pacific', term: 'hurricane' };
    // Central America splits the Atlantic from the East Pacific
    const pacificEdge = lat < 9 ? -78 : lat < 15 ? -86 : lat < 18 ? -94 : -100;
    if (lon < pacificEdge) return { name: 'East Pacific', term: 'hurricane' };
    if (lon < 40) return { name: 'North Atlantic', term: 'hurricane' };
  }
  if (lon >= 20 && lon < 90) return { name: 'South-West Indian Ocean', term: 'cyclone' };
  if (lon >= 90 && lon < 160) return { name: 'Australian region', term: 'cyclone' };
  if (lon >= 160 || lon < -70) return { name: 'South Pacific', term: 'cyclone' };
  return { name: 'South Atlantic', term: 'cyclone' };
}

const round = (n) => Math.round(n * 100) / 100;
const roundRing = (ring, step = 1) =>
  ring.filter((_, i) => i % step === 0 || i === ring.length - 1).map(([x, y]) => [round(x), round(y)]);

function ringCentre(ring) {
  let x = 0, y = 0;
  const n = ring.length - 1 || 1;
  for (let i = 0; i < n; i++) { x += ring[i][0]; y += ring[i][1]; }
  return [round(x / n), round(y / n)];
}

// key is "MMDDHHmm" in UTC
function keyToIso(key, year) {
  if (!key || key.length < 8) return null;
  return `${year}-${key.slice(0, 2)}-${key.slice(2, 4)}T${key.slice(4, 6)}:${key.slice(6, 8)}:00Z`;
}

export function slimGeometry(geo, storm) {
  const year = (storm.from || '').slice(0, 4) || new Date().getUTCFullYear();
  const track = [];
  const points = [];
  let cone = null;
  for (const f of geo.features || []) {
    const p = f.properties || {};
    const cls = p.Class || '';
    const g = f.geometry || {};
    if (cls.startsWith('Line_') && g.type === 'LineString') {
      track.push({ coords: g.coordinates.map(([x, y]) => [round(x), round(y)]), stage: p.polygonlabel, forecast: !!p.forecast });
    } else if (cls.startsWith('Point_Polygon_Point') && g.type === 'Polygon') {
      const iso = keyToIso(p.key, year);
      points.push({ c: ringCentre(g.coordinates[0]), t: iso, label: p.polygonlabel });
    } else if (cls === 'Poly_Cones' && (g.type === 'Polygon' || g.type === 'MultiPolygon')) {
      cone = g.type === 'Polygon'
        ? { type: 'Polygon', coordinates: g.coordinates.map((r) => roundRing(r, 3)) }
        : { type: 'MultiPolygon', coordinates: g.coordinates.map((poly) => poly.map((r) => roundRing(r, 3))) };
    }
  }
  const now = storm.to ? Date.parse(storm.to + 'Z') : Date.now();
  points.sort((a, b) => (a.t || '').localeCompare(b.t || ''));
  points.forEach((pt) => { pt.forecast = pt.t ? Date.parse(pt.t) > now : false; });
  return { track, points, cone };
}

export function slimEvent(f) {
  const p = f.properties;
  const [lon, lat] = f.geometry.coordinates;
  const kmh = Math.round((p.severitydata && p.severitydata.severity) || 0);
  const name = (p.eventname || p.name || 'Unnamed').replace(/-\d{2}$/, '');
  return {
    id: `${p.eventid}-${p.episodeid}`,
    eventid: p.eventid,
    episodeid: p.episodeid,
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    lon, lat,
    windKmh: kmh,
    windMph: Math.round(kmh / 1.609),
    category: category(kmh),
    basin: basin(lon, lat),
    alert: p.alertlevel,
    severityText: p.severitydata && p.severitydata.severitytext,
    countries: (p.affectedcountries || []).map((c) => c.countryname),
    from: p.fromdate,
    to: p.todate,
    updated: p.datemodified,
    source: p.source,
    report: p.url && p.url.report,
    geometryUrl: p.url && p.url.geometry,
  };
}

export async function loadStorms(fetchImpl = fetch) {
  const res = await fetchImpl(LIST_URL, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`GDACS list ${res.status}`);
  const list = await res.json();
  const events = (list.features || [])
    .filter((f) => f.properties && f.properties.eventtype === 'TC' && f.properties.iscurrent !== 'false')
    .map(slimEvent);

  await Promise.all(events.map(async (s) => {
    try {
      const r = await fetchImpl(s.geometryUrl);
      if (r.ok) Object.assign(s, slimGeometry(await r.json(), s));
    } catch (e) { /* storm still shows without a track */ }
    delete s.geometryUrl;
  }));

  events.sort((a, b) => b.windKmh - a.windKmh);
  return { generated: new Date().toISOString(), source: 'GDACS (JRC / UN OCHA), data from NOAA, JTWC and others', storms: events };
}
