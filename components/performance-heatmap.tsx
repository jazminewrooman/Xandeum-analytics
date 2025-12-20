'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PNode } from '@/lib/types/pnode';
import { calculateHeatMap, getStatusLabel, getHeatColor } from '@/lib/heatmap-calculator';

// Importar leaflet.heat dinámicamente
let HeatLayer: any;
if (typeof window !== 'undefined') {
  require('leaflet.heat');
  HeatLayer = (L as any).heatLayer;
}

interface HeatMapLayerProps {
  nodes: PNode[];
}

function HeatMapLayer({ nodes }: HeatMapLayerProps) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  
  useEffect(() => {
    if (!map || !HeatLayer) return;
    
    // Remove previous layers
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];
    
    const heatPoints = calculateHeatMap(nodes);
    
    // Debug: Log latency values
    console.log('🔥 Heat Map Debug:');
    console.log(`Total nodes: ${nodes.length}`);
    console.log(`Heat points: ${heatPoints.length}`);
    if (heatPoints.length > 0) {
      const latencies = heatPoints.map(p => p.value);
      const intensities = heatPoints.map(p => p.intensity);
      console.log(`Latency range: ${Math.min(...latencies).toFixed(2)} - ${Math.max(...latencies).toFixed(2)} min`);
      console.log(`Average latency: ${(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2)} min`);
      console.log(`Intensity range: ${Math.min(...intensities).toFixed(2)} - ${Math.max(...intensities).toFixed(2)}`);
      console.log(`Average intensity: ${(intensities.reduce((a, b) => a + b, 0) / intensities.length).toFixed(2)}`);
      
      // Distribución de performance
      const excellent = heatPoints.filter(p => p.value < 1).length;
      const good = heatPoints.filter(p => p.value >= 1 && p.value < 3).length;
      const fair = heatPoints.filter(p => p.value >= 3 && p.value < 5).length;
      const critical = heatPoints.filter(p => p.value >= 5).length;
      console.log(`Distribution: Excellent=${excellent}, Good=${good}, Fair=${fair}, Critical=${critical}`);
      
      // Top 3 clusters por tamaño
      const topClusters = heatPoints
        .sort((a, b) => b.nodes.length - a.nodes.length)
        .slice(0, 3);
      console.log('Top 3 largest clusters:', topClusters.map(p => ({
        location: `${p.city}, ${p.country}`,
        nodes: p.nodes.length,
        latency: p.value.toFixed(2),
        intensity: p.intensity.toFixed(2),
        color: p.color
      })));
      
      // CRITICAL clusters - los problemáticos
      const criticalClusters = heatPoints.filter(p => p.value >= 5);
      if (criticalClusters.length > 0) {
        console.log('⚠️ CRITICAL CLUSTERS:', criticalClusters.map(p => ({
          location: `${p.city}, ${p.country}`,
          nodes: p.nodes.length,
          latency: p.value.toFixed(2),
          intensity: p.intensity.toFixed(2),
          status: '🔴 OFFLINE/CRITICAL'
        })));
      }
    }
    
    if (heatPoints.length === 0) return;
    
    // Convert to Leaflet.heat format: [lat, lng, intensity]
    const heatData = heatPoints.map(point => [
      point.lat,
      point.lng,
      point.intensity
    ]);
    
    // Create heat layer with ULTRA enhanced visibility
    heatLayerRef.current = HeatLayer(heatData, {
      radius: 50,        // Radio GRANDE para máxima visibilidad
      blur: 60,          // Blur alto para efecto dramático
      maxZoom: 15,       // Visible en todos los zoom levels
      max: 0.4,          // MUY bajo para máxima sensibilidad
      minOpacity: 0.4,   // Opacidad mínima alta = siempre visible
      gradient: {
        0.0: 'rgba(16, 185, 129, 0)',    // Transparente
        0.15: '#10b981',  // Verde brillante
        0.25: '#22c55e',  // Verde
        0.35: '#84cc16',  // Lima
        0.45: '#fbbf24',  // Amarillo brillante
        0.55: '#fb923c',  // Naranja claro
        0.65: '#f97316',  // Naranja
        0.75: '#ef4444',  // Rojo
        0.85: '#dc2626',  // Rojo oscuro
        1.0: '#991b1b'    // Rojo muy oscuro
      }
    }).addTo(map);
    
    // Add custom markers for clusters with dynamic sizes
    heatPoints.forEach(point => {
      // Radio dinámico: más nodos = marker más grande
      let baseRadius = 8;
      let sizeBoost = Math.min(8, Math.log2(point.nodes.length + 1) * 2);
      
      // Clusters críticos = MUCHO más grandes
      if (point.value >= 5) {
        baseRadius = 12;
        sizeBoost += 4;
      } else if (point.value >= 3) {
        baseRadius = 10;
        sizeBoost += 2;
      }
      
      const finalRadius = baseRadius + sizeBoost;
      
      // Stroke más grueso para clusters problemáticos
      const strokeWeight = point.value >= 5 ? 3 : point.value >= 3 ? 2.5 : 2;
      const strokeColor = point.value >= 5 ? '#fef3c7' : '#fff'; // Amarillo claro para críticos
      
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: finalRadius,
        fillColor: point.color,
        color: strokeColor,
        weight: strokeWeight,
        opacity: 1,
        fillOpacity: point.value >= 5 ? 0.95 : 0.8, // Más opaco si es crítico
        className: point.value >= 5 ? 'critical-marker' : '' // Para animación CSS
      });
      
      const isCritical = point.value >= 5;
      const isFair = point.value >= 3 && point.value < 5;
      const headerBg = isCritical ? '#fee2e2' : isFair ? '#fed7aa' : '#f0fdf4';
      const headerColor = isCritical ? '#991b1b' : isFair ? '#9a3412' : '#166534';
      
      marker.bindPopup(`
        <div style="padding: 0; min-width: 200px; border-radius: 8px; overflow: hidden;">
          <div style="background: ${headerBg}; padding: 12px; border-bottom: 2px solid ${point.color};">
            <div style="font-weight: bold; font-size: 15px; color: ${headerColor};">
              ${isCritical ? '🔴 CRITICAL' : isFair ? '🟠 WARNING' : '✅ HEALTHY'} Cluster
            </div>
          </div>
          <div style="padding: 12px; font-size: 12px; color: #374151;">
            <p style="margin: 6px 0;"><strong>📍 Location:</strong> ${point.city || 'Unknown'}, ${point.country || 'Unknown'}</p>
            <p style="margin: 6px 0;"><strong>🖥️ Nodes:</strong> ${point.nodes.length}</p>
            <p style="margin: 6px 0;"><strong>⏱️ Avg Latency:</strong> <span style="color: ${point.color}; font-weight: bold;">${point.value.toFixed(1)} min</span></p>
            <p style="margin: 6px 0;"><strong>📊 Status:</strong> ${getStatusLabel(point.value)}</p>
            ${isCritical ? '<p style="margin: 8px 0 0 0; padding: 8px; background: #fef3c7; border-radius: 4px; font-size: 11px;"><strong>⚠️ Alert:</strong> Some nodes may be offline</p>' : ''}
          </div>
        </div>
      `);
      
      marker.addTo(map);
      markersRef.current.push(marker);
    });
    
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
      markersRef.current.forEach(marker => map.removeLayer(marker));
    };
  }, [map, nodes]);
  
  return null;
}

interface PerformanceHeatMapProps {
  nodes: PNode[];
}

export function PerformanceHeatMap({ nodes }: PerformanceHeatMapProps) {
  const geoNodes = nodes.filter(n => n.lat && n.lng);
  
  // Calculate performance stats
  const now = Date.now();
  const performanceStats = {
    excellent: geoNodes.filter(n => (now - n.lastSeen.getTime()) / 1000 / 60 < 1).length,
    good: geoNodes.filter(n => {
      const min = (now - n.lastSeen.getTime()) / 1000 / 60;
      return min >= 1 && min < 3;
    }).length,
    fair: geoNodes.filter(n => {
      const min = (now - n.lastSeen.getTime()) / 1000 / 60;
      return min >= 3 && min < 5;
    }).length,
    critical: geoNodes.filter(n => (now - n.lastSeen.getTime()) / 1000 / 60 >= 5).length
  };
  
  if (geoNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔥</span>
          </div>
          <p className="text-gray-600 font-medium mb-2">No Geocoded Nodes Yet</p>
          <p className="text-sm text-gray-500">
            Waiting for nodes to be geocoded...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[30, 0]}
        zoom={2}
        className="w-full h-full"
        zoomControl={true}
        style={{ background: '#f9fafb' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatMapLayer nodes={geoNodes} />
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[1000] border border-gray-200">
        <h3 className="font-bold text-sm mb-3 text-gray-900">🔥 Performance Heat Map</h3>
        <div className="space-y-2 text-xs mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-gray-700">Excellent (&lt; 1 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500" />
            <span className="text-gray-700">Good (1-3 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500" />
            <span className="text-gray-700">Fair (3-5 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-gray-700">Critical (&gt; 5 min)</span>
          </div>
        </div>
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 italic">
            💡 Brighter areas = slower response<br/>
            📍 Larger circles = more nodes
          </p>
        </div>
      </div>
      
      {/* Stats Badge */}
      <div className={`absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] min-w-[160px] ${
        performanceStats.critical > 0 ? 'border-2 border-red-400' : 'border border-gray-200'
      }`}>
        {performanceStats.critical > 0 && (
          <div className="bg-red-100 border border-red-300 rounded px-2 py-1 mb-2 text-xs font-semibold text-red-700">
            ⚠️ {performanceStats.critical} Critical Alert{performanceStats.critical > 1 ? 's' : ''}
          </div>
        )}
        <div className="text-xs text-gray-500 mb-2">Performance Status</div>
        <div className="text-lg font-bold text-gray-900 mb-3">
          {geoNodes.length} <span className="text-sm font-normal text-gray-600">nodes</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">Excellent</span>
            </div>
            <span className="font-semibold text-gray-900">{performanceStats.excellent}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-600">Good</span>
            </div>
            <span className="font-semibold text-gray-900">{performanceStats.good}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-gray-600">Fair</span>
            </div>
            <span className="font-semibold text-gray-900">{performanceStats.fair}</span>
          </div>
          <div className={`flex items-center justify-between gap-3 ${performanceStats.critical > 0 ? 'bg-red-50 -mx-1 px-1 py-1 rounded' : ''}`}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">Critical</span>
            </div>
            <span className={`font-semibold ${performanceStats.critical > 0 ? 'text-red-700' : 'text-gray-900'}`}>
              {performanceStats.critical}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
