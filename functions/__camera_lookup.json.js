const CITY_SOURCE = "https://traffic.transportdata.tw/MOTC/v2/Road/Traffic/CCTV/City/NantouCounty?$format=JSON";
const HIGHWAY_FILTER = encodeURIComponent("PositionLat ge 23.4 and PositionLat le 24.3 and PositionLon ge 120.55 and PositionLon le 121.35");
const HIGHWAY_SOURCE = `https://traffic.transportdata.tw/MOTC/v2/Road/Traffic/CCTV/Highway?$filter=${HIGHWAY_FILTER}&$format=JSON`;

export async function onRequestGet({ request }) {
  const requestUrl = new URL(request.url);
  const lat = Number(requestUrl.searchParams.get("lat"));
  const lng = Number(requestUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return json({ error: "lat and lng are required", cameras: [] }, 400);
  }

  const results = await Promise.allSettled([fetchCatalog(CITY_SOURCE), fetchCatalog(HIGHWAY_SOURCE)]);
  const catalogs = results
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value.CCTVs || []);

  if (!catalogs.length) {
    return json({ error: "Public camera data is temporarily unavailable", cameras: [] }, 503);
  }

  const cameras = catalogs
    .map(normalizeCamera)
    .filter((camera) => camera && (camera.imageUrl || camera.streamUrl))
    .map((camera) => ({ ...camera, distanceKm: haversineKm(lat, lng, camera.lat, camera.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 8)
    .map((camera) => ({
      ...camera,
      statusText: `距學校 ${formatDistance(camera.distanceKm)} · 公開即時影像`
    }));

  return json({
    cameras,
    source: "交通部 TDX 與南投縣公開交通影像",
    queriedAt: new Date().toISOString()
  });
}

async function fetchCatalog(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cf: { cacheEverything: true, cacheTtl: 21600 }
  });
  if (!response.ok) throw new Error(`TDX returned ${response.status}`);
  return response.json();
}

function normalizeCamera(item) {
  const lat = Number(item.PositionLat);
  const lng = Number(item.PositionLon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const pageUrl = String(item.VideoStreamURL || "");
  const cityStreamMatch = pageUrl.match(/\/cctv\/(\d+)\.html(?:\?.*)?$/i);
  const streamUrl = cityStreamMatch
    ? `https://trafficcctv.nantou.gov.tw/cctv/${cityStreamMatch[1]}/${cityStreamMatch[1]}.m3u8`
    : "";
  const imageUrl = String(item.VideoImageURL || "");
  const location = item.SurveillanceDescription || item.LocationMile || item.CCTVID;
  const roadName = item.RoadName ? `${item.RoadName} ${location}` : location;

  return {
    id: String(item.CCTVID || `${lat},${lng}`),
    title: roadName,
    shortTitle: roadName,
    sourceName: item.SubAuthorityCode ? "交通部公路局公開影像" : "南投縣公開交通影像",
    pageUrl: pageUrl || imageUrl,
    imageUrl,
    streamUrl,
    lat,
    lng
  };
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceKm) {
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} 公尺` : `${distanceKm.toFixed(1)} 公里`;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200 ? "public, max-age=60, stale-while-revalidate=300" : "no-store",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
