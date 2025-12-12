import { NextResponse } from 'next/server';
import http from 'http';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * API Route with Geocoding
 * Fetches nodes and adds lat/lng for map display
 */
export async function GET() {
  try {
    const apiVersion = (process.env.NEXT_PUBLIC_API_VERSION || '0.6').trim();
    const method = apiVersion === '0.7' ? 'get-pods-with-stats' : 'get-pods';

    console.log('🗺️ Fetching nodes with geocoding');

    // Get nodes from RPC
    const result = await new Promise<any>((resolve, reject) => {
      const postData = JSON.stringify({
        jsonrpc: '2.0',
        method: method,
        id: 1
      });

      const options = {
        hostname: '173.212.220.65',
        port: 6000,
        path: '/rpc',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Parse error: ${e}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });

    if (result.error) {
      throw new Error(`RPC Error: ${result.error.message}`);
    }

    // Transform nodes first (fast)
    const pods = result.result?.pods || [];
    
    // Extract all IPs
    const allIps = pods
      .map((pod: any) => pod.address?.split(':')[0])
      .filter((ip: string) => ip && ip !== 'unknown');
    
    // Import geocoding module with cache
    const { getLocationFromIP, cache } = await import('@/lib/geocoding');
    
    // Check cache for all IPs
    const locations = new Map();
    const uncachedIps = [];
    
    for (const ip of allIps) {
      const cached = cache.get(ip);
      if (cached) {
        locations.set(ip, cached);
      } else {
        uncachedIps.push(ip);
      }
    }
    
    // Geocode up to 15 uncached IPs per request (faster incremental geocoding)
    // At 45 req/min limit, 15 IPs = ~20 seconds per request
    let newlyGeocoded = 0;
    const maxNewGeocode = Math.min(15, uncachedIps.length);
    
    for (let i = 0; i < maxNewGeocode; i++) {
      const ip = uncachedIps[i];
      try {
        const location = await getLocationFromIP(ip);
        if (location) {
          locations.set(ip, location);
          newlyGeocoded++;
        }
        
        // Small delay between requests to avoid rate limit (1.3s = ~45 req/min)
        if (i < maxNewGeocode - 1) {
          await new Promise(resolve => setTimeout(resolve, 1300));
        }
      } catch (error) {
        console.error(`Failed to geocode ${ip}:`, error);
      }
    }

    console.log(`📊 Geocoding status: ${locations.size} total (${locations.size - newlyGeocoded} cached, ${newlyGeocoded} new)`);

    // Transform ALL nodes with available geocoding data
    const nodes = pods.map((pod: any) => {
      const ip = pod.address?.split(':')[0] || 'unknown';
      const location = ip !== 'unknown' ? locations.get(ip) : null;

      return {
        address: pod.address || 'unknown',
        pubkey: pod.pubkey,
        version: pod.version || 'unknown',
        lastSeen: pod.last_seen_timestamp,
        isPublic: pod.is_public,
        rpcPort: pod.rpc_port,
        storageCommitted: pod.storage_committed,
        storageUsed: pod.storage_used,
        storageUsagePercent: pod.storage_usage_percent,
        uptime: pod.uptime,
        // Geocoding data
        lat: location?.lat,
        lng: location?.lng,
        city: location?.city,
        country: location?.country,
        countryCode: location?.countryCode,
      };
    });

    return NextResponse.json({
      nodes,
      totalCount: result.result?.total_count || nodes.length,
      apiVersion,
      timestamp: Date.now(),
      geocoded: nodes.filter((n: any) => n.lat).length
    });
  } catch (error) {
    console.error('❌ Geo API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch' },
      { status: 500 }
    );
  }
}
