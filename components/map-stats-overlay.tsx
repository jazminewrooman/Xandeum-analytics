'use client';

import { PNode } from '@/lib/types/pnode';
import { formatBytes } from '@/lib/utils';
import { Server, MapPin, Globe, Activity } from 'lucide-react';

interface MapStatsOverlayProps {
  nodes: PNode[];
}

export function MapStatsOverlay({ nodes }: MapStatsOverlayProps) {
  // Validar que nodes es un array
  const validNodes = Array.isArray(nodes) ? nodes.filter(n => n && typeof n === 'object') : [];
  
  const totalCount = validNodes.length;
  const geoNodes = validNodes.filter(n => n.lat && n.lng);
  const activeNodes = validNodes.filter(node => {
    try {
      if (!node.lastSeen) return false;
      const minutesAgo = (new Date().getTime() - node.lastSeen.getTime()) / 1000 / 60;
      return minutesAgo < 5;
    } catch {
      return false;
    }
  }).length;
  
  const countries = new Set(geoNodes.map(n => n.country).filter(Boolean));
  const totalStorage = validNodes.reduce((sum, node) => sum + (node.storageUsed || 0), 0);

  const stats = [
    {
      icon: Server,
      label: 'Total Nodes',
      value: totalCount,
      subtitle: `${activeNodes} online`,
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: MapPin,
      label: 'Geocoded',
      value: geoNodes.length,
      subtitle: `${Math.round((geoNodes.length/totalCount)*100)}% located`,
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Globe,
      label: 'Countries',
      value: countries.size,
      subtitle: 'Worldwide',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Activity,
      label: 'Storage',
      value: formatBytes(totalStorage),
      subtitle: 'Total capacity',
      color: 'from-pink-500 to-pink-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-all"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 md:p-2.5 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium mb-0.5">{stat.label}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-600 truncate">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
