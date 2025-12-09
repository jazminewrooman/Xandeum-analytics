import { PNodeAdapter } from './types';
import { PNode, PNodeResponse } from '../types/pnode';

/**
 * Adapter for pRPC API v0.6
 * Uses separate endpoints: get-pods and get-stats
 */
export class V06Adapter implements PNodeAdapter {
  readonly version = '0.6';
  readonly supportsDetailedStats = false;
  
  constructor(private rpcUrl: string, private timeout: number = 10000) {}
  
  async fetchNodes(): Promise<PNodeResponse> {
    try {
      // Call get-pods endpoint
      const response = await fetch(`${this.rpcUrl}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'get-pods',
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
        // v0.6 doesn't provide these stats
        isPublic: undefined,
        rpcPort: undefined,
        storageCommitted: undefined,
        storageUsed: undefined,
        storageUsagePercent: undefined,
        uptime: undefined,
      }));
      
      return {
        nodes,
        totalCount: data.result?.total_count || nodes.length,
        apiVersion: this.version,
        timestamp: new Date()
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`v0.6 API Error: ${error.message}`);
      }
      throw error;
    }
  }
}
