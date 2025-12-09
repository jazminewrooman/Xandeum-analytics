import { NextResponse } from 'next/server';
import http from 'http';
import { getLocationFromIP } from '@/lib/geocoding';

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

    // Transform and geocode nodes
    const pods = result.result?.pods || [];
    const nodes = await Promise.all(
      pods.map(async (pod: any) => {
        const ip = pod.address?.split(':')[0] || 'unknown';
        const location = ip !== 'unknown' ? await getLocationFromIP(ip) : null;

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
      })
    );

    console.log(`✅ Geocoded ${nodes.filter(n => n.lat).length}/${nodes.length} nodes`);

    return NextResponse.json({
      nodes,
      totalCount: result.result?.total_count || nodes.length,
      apiVersion,
      timestamp: Date.now(),
      geocoded: nodes.filter(n => n.lat).length
    });
  } catch (error) {
    console.error('❌ Geo API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch' },
      { status: 500 }
    );
  }
}
