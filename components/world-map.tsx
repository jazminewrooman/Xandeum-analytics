'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PNode } from '@/lib/types/pnode';
import { formatBytes, timeAgo, getNodeStatus } from '@/lib/utils';
import L from 'leaflet';

// Fix Leaflet icon paths for Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface WorldMapProps {
  nodes: PNode[];
}

// Map center updater component
function MapUpdater({ nodes }: { nodes: PNode[] }) {
  const map = useMap();
  
  useEffect(() => {
    const geoNodes = nodes.filter(n => n.lat && n.lng);
    if (geoNodes.length > 0) {
      const bounds = geoNodes.map(n => [n.lat!, n.lng!] as [number, number]);
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 4 });
      }
    }
  }, [nodes, map]);
  
  return null;
}

export function WorldMap({ nodes }: WorldMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  // Validar y filtrar nodos con coordenadas válidas
  const validNodes = Array.isArray(nodes) ? nodes : [];
  const geoNodes = validNodes.filter(n => {
    return n && 
           typeof n.lat === 'number' && 
           typeof n.lng === 'number' &&
           !isNaN(n.lat) && 
           !isNaN(n.lng) &&
           n.lat >= -90 && 
           n.lat <= 90 &&
           n.lng >= -180 && 
           n.lng <= 180;
  });

  // Create custom colored markers using DivIcon
  const createIcon = (status: 'online' | 'warning' | 'offline') => {
    const color = status === 'online' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444';
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-[var(--border)]">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater nodes={geoNodes} />

        {geoNodes.map((node, idx) => {
          try {
            const status = getNodeStatus(node.lastSeen);
            const icon = createIcon(status);

            return (
              <Marker
                key={`marker-${idx}-${node.pubkey || node.address}`}
                position={[node.lat!, node.lng!]}
                icon={icon}
              >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      status === 'online' ? 'bg-green-500' : 
                      status === 'warning' ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`} />
                    <p className="font-semibold text-sm">
                      {node.city || 'Unknown'}, {node.country || 'Unknown'}
                    </p>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <p>
                      <span className="font-medium">IP:</span>{' '}
                      <span className="font-mono text-[10px]">
                        {node.address.split(':')[0]}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Version:</span> {node.version}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Coords: {node.lat?.toFixed(4)}, {node.lng?.toFixed(4)}
                    </p>
                    {node.storageUsed && (
                      <p>
                        <span className="font-medium">Storage:</span>{' '}
                        {formatBytes(node.storageUsed)}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Last seen:</span>{' '}
                      {timeAgo(node.lastSeen)}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
          } catch (error) {
            console.error('Error rendering marker:', error);
            return null;
          }
        }).filter(Boolean)}
      </MapContainer>
    </div>
  );
}
