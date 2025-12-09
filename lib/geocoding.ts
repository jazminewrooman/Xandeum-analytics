/**
 * Geocoding service to get lat/lng from IP addresses
 */

export interface GeoLocation {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  countryCode?: string;
}

const cache = new Map<string, GeoLocation>();

/**
 * Get geolocation from IP address using ip-api.com
 * Free tier: 45 requests per minute
 */
export async function getLocationFromIP(ip: string): Promise<GeoLocation | null> {
  // Check cache first
  if (cache.has(ip)) {
    return cache.get(ip)!;
  }

  try {
    // Extract IP if it's in format "ip:port"
    const cleanIp = ip.split(':')[0];
    
    // Skip private IPs
    if (isPrivateIP(cleanIp)) {
      return null;
    }

    const response = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,lat,lon,city,country,countryCode`);
    const data = await response.json();

    if (data.status === 'success') {
      const location: GeoLocation = {
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        country: data.country,
        countryCode: data.countryCode
      };
      
      cache.set(ip, location);
      return location;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to geocode IP ${ip}:`, error);
    return null;
  }
}

/**
 * Batch geocode multiple IPs with rate limiting
 */
export async function batchGeocode(ips: string[]): Promise<Map<string, GeoLocation>> {
  const results = new Map<string, GeoLocation>();
  
  // Process in batches of 40 to stay under rate limit (45/min)
  const batchSize = 40;
  const delay = 60000 / 45; // ~1.3 seconds per request
  
  for (let i = 0; i < ips.length; i++) {
    const ip = ips[i];
    
    // Check cache first
    if (cache.has(ip)) {
      const cached = cache.get(ip)!;
      results.set(ip, cached);
      continue;
    }
    
    // Geocode with delay
    const location = await getLocationFromIP(ip);
    if (location) {
      results.set(ip, location);
    }
    
    // Add delay every batch
    if ((i + 1) % batchSize === 0 && i < ips.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else if (i < ips.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

/**
 * Check if IP is private/local
 */
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return true;
  
  const first = parseInt(parts[0]);
  const second = parseInt(parts[1]);
  
  // 10.0.0.0 - 10.255.255.255
  if (first === 10) return true;
  
  // 172.16.0.0 - 172.31.255.255
  if (first === 172 && second >= 16 && second <= 31) return true;
  
  // 192.168.0.0 - 192.168.255.255
  if (first === 192 && second === 168) return true;
  
  // 127.0.0.0 - 127.255.255.255 (localhost)
  if (first === 127) return true;
  
  return false;
}
