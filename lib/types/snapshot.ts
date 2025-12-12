export interface NetworkSnapshot {
  timestamp: number; // Unix timestamp in milliseconds
  totalNodes: number;
  onlineNodes: number;
  geocodedNodes: number;
  avgResponseTime: number; // Average minutes since last seen
  versionDistribution: Record<string, number>; // version -> count
  countries: number; // Unique countries
  healthScore: number; // 0-100
}

export interface SnapshotStats {
  snapshots: NetworkSnapshot[];
  oldestSnapshot: number | null;
  newestSnapshot: number | null;
  totalSnapshots: number;
  timeRangeHours: number;
}
