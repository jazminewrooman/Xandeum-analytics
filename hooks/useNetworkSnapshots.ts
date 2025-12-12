'use client';

import { useEffect, useState, useCallback } from 'react';
import { PNode } from '@/lib/types/pnode';
import { NetworkSnapshot, SnapshotStats } from '@/lib/types/snapshot';

const STORAGE_KEY = 'xandeum_network_snapshots';
const MAX_SNAPSHOTS = 480; // 4 horas a 30 segundos = 480 snapshots
const SNAPSHOT_INTERVAL = 30000; // 30 segundos

export function useNetworkSnapshots(nodes: PNode[]) {
  const [snapshots, setSnapshots] = useState<NetworkSnapshot[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load snapshots from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as NetworkSnapshot[];
        setSnapshots(parsed);
      }
    } catch (error) {
      console.error('Failed to load snapshots:', error);
    }
    setIsInitialized(true);
  }, []);

  // Create snapshot from current node data
  const createSnapshot = useCallback((nodes: PNode[]): NetworkSnapshot => {
    const now = Date.now();
    
    // Online nodes (last seen < 5 min)
    const onlineNodes = nodes.filter(node => {
      const minutesAgo = (now - node.lastSeen.getTime()) / 1000 / 60;
      return minutesAgo < 5;
    });

    // Geocoded nodes
    const geocodedNodes = nodes.filter(n => n.lat && n.lng);

    // Average response time
    const avgResponseTime = nodes.reduce((sum, node) => {
      const minutesAgo = (now - node.lastSeen.getTime()) / 1000 / 60;
      return sum + minutesAgo;
    }, 0) / (nodes.length || 1);

    // Version distribution
    const versionDistribution: Record<string, number> = {};
    nodes.forEach(node => {
      versionDistribution[node.version] = (versionDistribution[node.version] || 0) + 1;
    });

    // Countries
    const uniqueCountries = new Set(geocodedNodes.map(n => n.country).filter(Boolean));

    // Simple health score calculation
    const availabilityScore = (onlineNodes.length / nodes.length) * 100;
    const responseScore = Math.max(0, 100 - (avgResponseTime * 2));
    const geocodingScore = (geocodedNodes.length / nodes.length) * 100;
    const healthScore = Math.round(
      (availabilityScore * 0.5) + 
      (responseScore * 0.3) + 
      (geocodingScore * 0.2)
    );

    return {
      timestamp: now,
      totalNodes: nodes.length,
      onlineNodes: onlineNodes.length,
      geocodedNodes: geocodedNodes.length,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      versionDistribution,
      countries: uniqueCountries.size,
      healthScore: Math.min(100, Math.max(0, healthScore))
    };
  }, []);

  // Add new snapshot
  const addSnapshot = useCallback((nodes: PNode[]) => {
    if (!nodes || nodes.length === 0) return;

    const newSnapshot = createSnapshot(nodes);
    
    setSnapshots(prev => {
      // Add new snapshot
      const updated = [...prev, newSnapshot];
      
      // Keep only last MAX_SNAPSHOTS
      const trimmed = updated.length > MAX_SNAPSHOTS 
        ? updated.slice(-MAX_SNAPSHOTS)
        : updated;
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch (error) {
        console.error('Failed to save snapshots:', error);
      }
      
      return trimmed;
    });
  }, [createSnapshot]);

  // Auto-snapshot every SNAPSHOT_INTERVAL
  useEffect(() => {
    if (!isInitialized || !nodes || nodes.length === 0) return;

    // Create initial snapshot immediately
    addSnapshot(nodes);

    // Then create periodic snapshots
    const interval = setInterval(() => {
      addSnapshot(nodes);
    }, SNAPSHOT_INTERVAL);

    return () => clearInterval(interval);
  }, [nodes, isInitialized, addSnapshot]);

  // Get stats about snapshots
  const stats: SnapshotStats = {
    snapshots,
    oldestSnapshot: snapshots[0]?.timestamp || null,
    newestSnapshot: snapshots[snapshots.length - 1]?.timestamp || null,
    totalSnapshots: snapshots.length,
    timeRangeHours: snapshots.length > 1 
      ? (snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp) / 1000 / 60 / 60
      : 0
  };

  return {
    snapshots,
    stats,
    addSnapshot: () => addSnapshot(nodes),
    clearSnapshots: () => {
      setSnapshots([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };
}
