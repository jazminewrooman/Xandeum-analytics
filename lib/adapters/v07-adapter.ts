import { PNodeAdapter } from './types';
import { PNode, PNodeResponse } from '../types/pnode';

/**
 * Adapter for pRPC API v0.7
 * Uses single endpoint: get-pods-with-stats (includes all data)
 */
export class V07Adapter implements PNodeAdapter {
  readonly version = '0.7';
  readonly supportsDetailedStats = true;
  
  constructor(private rpcUrl: string, private timeout: number = 10000) {}
  
  async fetchNodes(): Promise<PNodeResponse> {
    try {
      // Call get-pods-with-stats endpoint
      const response = await fetch(`${this.rpcUrl}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'get-pods-with-stats',
          id: 1
        }),
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      
      // Transform to unified format
      const nodes: PNode[] = (data.result?.pods || []).map((pod: any) => ({
        address: pod.address || 'unknown',
        pubkey: pod.pubkey,
        version: pod.version || 'unknown',
        lastSeen: new Date(pod.last_seen_timestamp * 1000),
        // v0.7 provides detailed stats ✨
        isPublic: pod.is_public,
        rpcPort: pod.rpc_port,
        storageCommitted: pod.storage_committed,
        storageUsed: pod.storage_used,
        storageUsagePercent: pod.storage_usage_percent,
        uptime: pod.uptime,
      }));
      
      return {
        nodes,
        totalCount: data.result?.total_count || nodes.length,
        apiVersion: this.version,
        timestamp: new Date()
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`v0.7 API Error: ${error.message}`);
      }
      throw error;
    }
  }
}
