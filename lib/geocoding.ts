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

// Export cache for external access
export const cache = new Map<string, GeoLocation>();

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

    const response = await fetch(
      `http://ip-api.com/json/${cleanIp}?fields=status,lat,lon,city,country,countryCode,isp,org,as`,
      { 
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    );

    // Check if response is ok before parsing
    if (!response.ok) {
      console.warn(`⚠️ ip-api returned ${response.status} for ${cleanIp}`);
      return null;
    }

    // Check if response has content
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      console.warn(`⚠️ Empty response from ip-api for ${cleanIp}`);
      return null;
    }

    const data = JSON.parse(text);

    if (data.status === 'success') {
      const location: GeoLocation = {
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        country: data.country,
        countryCode: data.countryCode
      };
      
      // Log para debug (puedes ver en consola del servidor)
      console.log(`📍 ${cleanIp} → ${data.city}, ${data.country} (${data.isp || data.org || 'Unknown ISP'})`);
      
      cache.set(ip, location);
      return location;
    } else if (data.status === 'fail') {
      console.warn(`⚠️ ip-api failed for ${cleanIp}: ${data.message || 'Rate limit or invalid IP'}`);
      return null;
    }
    
    return null;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn(`⏱️ Timeout geocoding ${ip}`);
      } else {
        console.error(`❌ Failed to geocode IP ${ip}:`, error.message);
      }
    }
    return null;
  }
}

/**
 * Batch geocode multiple IPs with rate limiting
 * Rate limit: 45 requests/minute for free tier
 */
export async function batchGeocode(ips: string[]): Promise<Map<string, GeoLocation>> {
  const results = new Map<string, GeoLocation>();
  
  // Filter out IPs that are already cached
  const uncachedIps = ips.filter(ip => !cache.has(ip));
  
  // Return cached results immediately
  ips.forEach(ip => {
    const cached = cache.get(ip);
    if (cached) {
      results.set(ip, cached);
    }
  });
  
  if (uncachedIps.length === 0) {
    console.log('✅ All IPs already geocoded (cached)');
    return results;
  }
  
  console.log(`🌍 Geocoding ${uncachedIps.length} new IPs (${ips.length - uncachedIps.length} cached)`);
  
  // Process sequentially with delays to respect rate limits
  // 45 requests/min = 1 request per ~1.3 seconds to be safe
  const delayMs = 1400; // 1.4 seconds between requests
  
  for (let i = 0; i < uncachedIps.length; i++) {
    const ip = uncachedIps[i];
    
    try {
      const location = await getLocationFromIP(ip);
      if (location) {
        results.set(ip, location);
      }
    } catch (error) {
      console.error(`Error geocoding ${ip}:`, error);
    }
    
    // Delay between requests (except for last one)
    if (i < uncachedIps.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`✅ Geocoded ${results.size}/${ips.length} IPs successfully`);
  
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
