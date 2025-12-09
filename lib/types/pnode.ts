/**
 * Unified PNode interface used throughout the application
 * Works with both v0.6 and v0.7 API responses
 */
export interface PNode {
  // Basic info (available in all versions)
  address: string;
  pubkey: string | null;
  version: string;
  lastSeen: Date;
  isPublic: boolean | null;
  rpcPort: number | null;
  
  // Optional fields (available in v0.7+ with detailed stats)
  storageCommitted?: number | null;
  storageUsed?: number | null;
  storageUsagePercent?: number | null;
  uptime?: number | null; // in seconds
  
  // Geocoding fields (added via IP geolocation)
  lat?: number;
  lng?: number;
  city?: string;
  country?: string;
  countryCode?: string;
}

/**
 * Response from the API client
 */
export interface PNodeResponse {
  nodes: PNode[];
  totalCount: number;
  apiVersion: string;
  timestamp: Date;
}

/**
 * Stats for individual pNode (from get-stats in v0.6)
 */
export interface PNodeStats {
  active_streams: number;
  cpu_percent: number;
  current_index: number;
  file_size: number;
  last_updated: number;
  packets_received: number;
  packets_sent: number;
  ram_total: number;
  ram_used: number;
  total_bytes: number;
  total_pages: number;
  uptime: number;
}
