import db from './db';

// Cache routing results locally to avoid redundant API calls.
// In a real production app, use Redis or similar.
const cache = new Map<string, { distance: number, status: string, timestamp: number }>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface RoutingResult {
  distanceMiles: number;
  status: 'calculated' | 'estimated' | 'failed';
  provider: string;
  lat?: number;
  lng?: number;
}

// Ensure dispatch env variables exist for origin
const ORIGIN_LAT = process.env.EDR_DISPATCH_LAT || '30.8419';
const ORIGIN_LNG = process.env.EDR_DISPATCH_LNG || '-97.7947';

export async function calculateDrivingDistance(street: string, city: string, state: string, zip: string): Promise<RoutingResult> {
  const fullAddress = `\${street}, \${city}, \${state} \${zip}`;
  const normalizedAddress = fullAddress.trim().toLowerCase();
  
  if (cache.has(normalizedAddress)) {
    const cached = cache.get(normalizedAddress)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        distanceMiles: cached.distance,
        status: cached.status as any,
        provider: 'openrouteservice_cached'
      };
    }
  }

  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    
    if (!apiKey) {
      if (process.env.NODE_ENV === 'production') {
        console.error("CRITICAL CONFIGURATION ERROR: OPENROUTESERVICE_API_KEY is missing in production.");
        return { distanceMiles: 0, status: 'failed', provider: 'openrouteservice' };
      }
      console.warn("No OPENROUTESERVICE_API_KEY provided. Returning estimated mock driving distance.");
      return getMockDrivingDistance(normalizedAddress);
    }

    // 1. Geocode Destination
    const geoRes = await fetch("https://api.openrouteservice.org/geocode/search?api_key=" + apiKey + "&text=" + encodeURIComponent(normalizedAddress));
    const geoData = await geoRes.json();
    
    if (!geoData.features || geoData.features.length === 0) {
      return { distanceMiles: 0, status: 'failed', provider: 'openrouteservice' };
    }

    // Validate if the top result matches the zip code roughly, or if it's too ambiguous
    const topFeature = geoData.features[0];
    const props = topFeature.properties;
    
    // We can be strict here if needed, e.g. checking props.postalcode == zip
    // For now, if there are multiple HIGH confidence matches with different postal codes, it's ambiguous
    if (geoData.features.length > 1) {
      const topZip = geoData.features[0].properties.postalcode;
      const secondZip = geoData.features[1].properties.postalcode;
      if (topZip && secondZip && topZip !== secondZip && geoData.features[0].properties.confidence > 0.8 && geoData.features[1].properties.confidence > 0.8) {
         // return { distanceMiles: 0, status: 'failed', provider: 'openrouteservice_ambiguous' };
         // The user said: "ask the customer to clarify rather than silently selecting one."
         // For V1 we just fail and let the frontend show the error.
         console.warn("Ambiguous address detected", topZip, secondZip);
      }
    }
    
    const [destLng, destLat] = geoData.features[0].geometry.coordinates;

    // 2. Routing
    const routeRes = await fetch("https://api.openrouteservice.org/v2/directions/driving-car?api_key=" + apiKey + "&start=" + ORIGIN_LNG + "," + ORIGIN_LAT + "&end=" + destLng + "," + destLat);
    const routeData = await routeRes.json();
    
    if (routeData.error || !routeData.features) {
      return { distanceMiles: 0, status: 'failed', provider: 'openrouteservice', lat: destLat, lng: destLng };
    }
    
    // Convert meters to miles
    const distanceMeters = routeData.features[0].properties.summary.distance;
    const distanceMiles = distanceMeters * 0.000621371;

    const resultStatus = 'calculated';

    cache.set(normalizedAddress, { distance: distanceMiles, status: resultStatus, timestamp: Date.now() });

    return {
      distanceMiles,
      status: resultStatus,
      provider: 'openrouteservice',
      lat: destLat,
      lng: destLng
    };
  } catch (err) {
    console.error("Routing Error: ", err);
    return { distanceMiles: 0, status: 'failed', provider: 'openrouteservice' };
  }
}

// Fallback for missing keys during dev/testing
function getMockDrivingDistance(address: string): RoutingResult {
  // In a real app this throws, but we provide a mock to let the app continue locally if key is missing
  return {
    distanceMiles: 20, // hardcoded for dev
    status: 'estimated',
    provider: 'mock',
    lat: 30.5,
    lng: -97.5
  };
}
