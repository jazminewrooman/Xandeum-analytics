import { NextResponse } from 'next/server';
import http from 'http';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * API Route Proxy - Evita problemas de CORS
 * El navegador llama a /api/nodes, y este llama al RPC
 */
export async function GET() {
  try {
    // Limpiar URL de espacios y caracteres invisibles
    const rawUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://207.244.255.1:6000';
    const rpcUrl = rawUrl.trim();
    
    const apiVersion = (process.env.NEXT_PUBLIC_API_VERSION || '0.6').trim();
    const method = apiVersion === '0.7' ? 'get-pods-with-stats' : 'get-pods';

    console.log('🔗 Using native http module');
    console.log('📦 Method:', method);

    // Usar http nativo en lugar de fetch
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

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`HTTP request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });

    if (result.error) {
      throw new Error(`RPC Error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    // Transform data
    const nodes = (result.result?.pods || []).map((pod: any) => ({
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
    }));

    return NextResponse.json({
      nodes,
      totalCount: result.result?.total_count || nodes.length,
      apiVersion,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ API Route Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch pNodes'
      },
      { status: 500 }
    );
  }
}
