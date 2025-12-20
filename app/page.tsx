'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { PNode } from '@/lib/types/pnode';
import { NodeTable } from '@/components/node-table';
import { MapStatsOverlay } from '@/components/map-stats-overlay';
import { CountryStatsSidebar } from '@/components/country-stats-sidebar';
import { NetworkChart } from '@/components/network-chart';
import { useNetworkSnapshots } from '@/hooks/useNetworkSnapshots';
import { Server, Loader2, Map as MapIcon, List, Menu, Download, Flame } from 'lucide-react';

const WorldMap = dynamic(
  () => import('@/components/world-map').then(mod => ({ default: mod.WorldMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }
);

const PerformanceHeatMap = dynamic(
  () => import('@/components/performance-heatmap').then(mod => ({ default: mod.PerformanceHeatMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    )
  }
);

type ViewMode = 'map' | 'list' | 'heatmap';

export default function Home() {
  const [nodes, setNodes] = useState<PNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Network snapshots for historical data
  const { snapshots, stats } = useNetworkSnapshots(nodes);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

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
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds to progressively geocode all nodes
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && nodes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="mb-6">
            <Image 
              src="/logo.png" 
              alt="Xandeum Logo" 
              width={80} 
              height={80}
              className="mx-auto mb-4"
              priority
            />
          </div>
          <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Loading Xandeum Network...
          </h1>
          <p className="text-[var(--text-secondary)]">
            Gathering pNode data
          </p>
        </div>
      </div>
    );
  }

  if (error && nodes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="mb-6">
            <Image 
              src="/logo.png" 
              alt="Xandeum Logo" 
              width={80} 
              height={80}
              className="mx-auto mb-4 opacity-50"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Failed to load data
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm z-20">
        <div className="max-w-full mx-auto px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center">
                <Image 
                  src="/logo.png" 
                  alt="Xandeum Logo" 
                  width={40} 
                  height={40}
                  className="w-8 h-8 md:w-10 md:h-10"
                  priority
                />
              </div>
              <div>
                <h1 className="text-base md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Xandeum Network
                </h1>
                <p className="text-xs text-gray-500 hidden md:block">
                  Real-time pNode Analytics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <MapIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all ${viewMode === 'heatmap' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Flame className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Heat</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <List className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            <div className="text-right hidden md:block">
              <p className="text-xs text-gray-500">
                {nodes.filter(n => n.lat).length}/{nodes.length} geocoded
              </p>
              <p className="text-sm font-medium text-gray-900">
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'map' && (
          <CountryStatsSidebar 
            nodes={nodes} 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'map' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chart Section - Scrollable */}
              <div className="overflow-y-auto bg-gradient-to-br from-purple-50 via-white to-pink-50">
                <div className="p-4 md:p-6 max-w-7xl mx-auto">
                  <NetworkChart 
                    snapshots={snapshots} 
                    timeRangeHours={stats.timeRangeHours}
                  />
                </div>
              </div>

              {/* Map Section - Fixed */}
              <div className="flex-1 relative min-h-[400px]">
                <div className="absolute inset-0">
                  <WorldMap nodes={nodes} />
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
                  <div className="pointer-events-auto">
                    <MapStatsOverlay nodes={nodes} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'heatmap' && (
            <div className="flex-1 relative">
              <PerformanceHeatMap nodes={nodes} />
            </div>
          )}

          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Chart in List View */}
                <NetworkChart 
                  snapshots={snapshots} 
                  timeRangeHours={stats.timeRangeHours}
                />

                {/* Node Table */}
                <NodeTable nodes={nodes} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
