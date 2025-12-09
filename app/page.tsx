'use client';

import { useEffect, useState } from 'react';
import { PNode } from '@/lib/types/pnode';
import { StatsCard } from '@/components/stats-card';
import { NodeTable } from '@/components/node-table';
import { Server, HardDrive, Activity, Zap, Loader2, MapPin } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import Link from 'next/link';

export default function Home() {
  const [nodes, setNodes] = useState<PNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📡 Fetching from API proxy...');

      // Llamar a nuestro API route en lugar del RPC directamente
      const response = await fetch('/api/nodes');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Transform timestamps
      const fetchedNodes = data.nodes.map((node: any) => ({
        ...node,
        lastSeen: new Date(node.lastSeen * 1000)
      }));

      setNodes(fetchedNodes);
      setLastUpdate(new Date());
      
      console.log('✅ Loaded', fetchedNodes.length, 'nodes');
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  if (loading && nodes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Loading pNode Data...
          </h1>
          <p className="text-[var(--text-secondary)]">
            Connecting to Xandeum Network
          </p>
        </div>
      </div>
    );
  }

  if (error && nodes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface)]">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--rose)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-[var(--danger)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Failed to load pNode data
          </h1>
          <p className="text-[var(--text-secondary)] mb-4">
            {error}
          </p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalCount = nodes.length;
  const apiVersion = process.env.NEXT_PUBLIC_API_VERSION || '0.6';
  const supportsDetailedStats = apiVersion === '0.7';
  
  const activeNodes = nodes.filter(node => {
    const minutesAgo = (new Date().getTime() - node.lastSeen.getTime()) / 1000 / 60;
    return minutesAgo < 5;
  }).length;

  // Version distribution
  const versionCounts = nodes.reduce((acc, node) => {
    const version = node.version.includes('0.7') ? '0.7.x' : 
                   node.version.includes('0.6') ? '0.6.x' : 
                   node.version.includes('0.5') ? '0.5.x' : 'other';
    acc[version] = (acc[version] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const latestVersion = '0.7.x';
  const latestVersionCount = versionCounts[latestVersion] || 0;
  const latestVersionPercent = totalCount > 0 ? (latestVersionCount / totalCount * 100).toFixed(0) : 0;

  // Total storage (only for v0.7 nodes with stats)
  const totalStorage = nodes.reduce((sum, node) => {
    return sum + (node.storageUsed || 0);
  }, 0);

  // Average uptime (only for v0.7 nodes with stats)
  const nodesWithUptime = nodes.filter(node => node.uptime && node.uptime > 0);
  const avgUptime = nodesWithUptime.length > 0
    ? nodesWithUptime.reduce((sum, node) => sum + (node.uptime || 0), 0) / nodesWithUptime.length
    : 0;
  const avgUptimeDays = (avgUptime / 86400).toFixed(1);

  const uptimePercent = totalCount > 0 ? (activeNodes / totalCount * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  Xandeum Network Analytics
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Real-time pNode monitoring • API v{apiVersion}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/map"
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors text-sm font-medium"
              >
                <MapPin className="w-4 h-4" />
                View Map
              </Link>
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)]">
                  Last updated
                </p>
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total pNodes"
            value={totalCount}
            subtitle={`${activeNodes} currently active`}
            icon={Server}
            index={0}
          />
          <StatsCard
            title="Latest Version"
            value={`${latestVersionPercent}%`}
            subtitle={`${latestVersionCount} nodes on ${latestVersion}`}
            icon={Zap}
            index={1}
          />
          <StatsCard
            title="Total Storage"
            value={formatBytes(totalStorage)}
            subtitle={supportsDetailedStats ? `Across ${nodesWithUptime.length} nodes` : 'Upgrade to v0.7 for stats'}
            icon={HardDrive}
            index={2}
          />
          <StatsCard
            title="Network Health"
            value={`${uptimePercent}%`}
            subtitle={avgUptimeDays !== '0.0' ? `Avg uptime: ${avgUptimeDays} days` : 'Nodes online'}
            icon={Activity}
            index={3}
          />
        </div>

        {/* Info Banner */}
        {!supportsDetailedStats && (
          <div className="mb-8 p-4 bg-[var(--lavender)] border border-[var(--primary)] rounded-lg">
            <p className="text-sm text-[var(--primary)]">
              <strong>Note:</strong> You're using API v{apiVersion}. Upgrade to v0.7 to see detailed storage and uptime statistics for all nodes.
            </p>
          </div>
        )}

        {/* Nodes Table */}
        <NodeTable nodes={nodes} />
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-[var(--border)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-[var(--text-secondary)]">
            Built for Xandeum Network • Data refreshes every 60 seconds
          </p>
        </div>
      </footer>
    </div>
  );
}
