'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PNode } from '@/lib/types/pnode';
import { StatsCard } from '@/components/stats-card';
import { Server, MapPin, Globe, Activity, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Importación dinámica del mapa (sin SSR)
const WorldMap = dynamic(
  () => import('@/components/world-map').then(mod => ({ default: mod.WorldMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }
);

export default function MapView() {
  const [nodes, setNodes] = useState<PNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [geocoded, setGeocoded] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🗺️ Fetching geocoded data...');

      const response = await fetch('/api/nodes-geo');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const fetchedNodes = data.nodes.map((node: any) => ({
        ...node,
        lastSeen: new Date(node.lastSeen * 1000)
      }));

      setNodes(fetchedNodes);
      setGeocoded(data.geocoded || 0);
      setLastUpdate(new Date());
      
      console.log('✅ Loaded', fetchedNodes.length, 'nodes,', data.geocoded, 'geocoded');
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000); // Refresh every 2 min (geocoding is slower)
    return () => clearInterval(interval);
  }, []);

  if (loading && nodes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Loading Network Map...
          </h1>
          <p className="text-[var(--text-secondary)]">
            Geocoding pNode locations...
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
            Failed to load map data
          </h1>
          <p className="text-[var(--text-secondary)] mb-4">{error}</p>
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

  const totalCount = nodes.length;
  const activeNodes = nodes.filter(node => {
    const minutesAgo = (new Date().getTime() - node.lastSeen.getTime()) / 1000 / 60;
    return minutesAgo < 5;
  }).length;

  const geoNodes = nodes.filter(n => n.lat && n.lng);
  const countries = new Set(geoNodes.map(n => n.country).filter(Boolean));

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    Global Network Map
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)]">
                    pNode locations worldwide
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-muted)]">Last updated</p>
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Nodes"
            value={totalCount}
            subtitle={`${activeNodes} active`}
            icon={Server}
            index={0}
          />
          <StatsCard
            title="Geocoded"
            value={geocoded}
            subtitle={`${Math.round((geocoded/totalCount)*100)}% located`}
            icon={MapPin}
            index={1}
          />
          <StatsCard
            title="Countries"
            value={countries.size}
            subtitle="Worldwide coverage"
            icon={Globe}
            index={2}
          />
          <StatsCard
            title="Network Health"
            value={`${Math.round((activeNodes/totalCount)*100)}%`}
            subtitle="Nodes online"
            icon={Activity}
            index={3}
          />
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6" style={{ height: '600px' }}>
          <WorldMap nodes={nodes} />
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Note:</strong> Node locations are determined by IP geolocation and may not be 100% accurate. 
            Map updates every 2 minutes. {geocoded < totalCount && `${totalCount - geocoded} nodes couldn't be geocoded.`}
          </p>
        </div>
      </main>
    </div>
  );
}
