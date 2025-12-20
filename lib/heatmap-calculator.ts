/**
 * Heat Map Calculator
 * Calculates performance heat map data from pNodes
 */

import { PNode } from './types/pnode';

export interface HeatMapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1 scale
  value: number; // Latency en minutos
  color: string;
  nodes: string[]; // Pubkeys de nodos en este cluster
  country?: string;
  city?: string;
}

export interface ClusterInfo {
  nodes: PNode[];
  center: { lat: number; lng: number };
  avgLatency: number;
  status: 'excellent' | 'good' | 'fair' | 'critical';
}

/**
 * Calcula puntos de heat map desde nodos
 */
export function calculateHeatMap(nodes: PNode[]): HeatMapPoint[] {
  const now = Date.now();
  const points: HeatMapPoint[] = [];
  
  // Filtrar solo nodos con coordenadas
  const geoNodes = nodes.filter(n => n.lat && n.lng);
  
  if (geoNodes.length === 0) {
    return [];
  }
  
  // Agrupar nodos cercanos (clustering)
  const clusters = clusterByProximity(geoNodes, 100); // 100km radius
  
  clusters.forEach(cluster => {
    if (cluster.nodes.length === 0) return;
    
    // Calcular latencia promedio del cluster
    const avgLatency = cluster.nodes.reduce((sum, node) => {
      const minutesAgo = (now - node.lastSeen.getTime()) / 1000 / 60;
      return sum + minutesAgo;
    }, 0) / cluster.nodes.length;
    
    // Centro del cluster
    const centerLat = cluster.nodes.reduce((sum, n) => sum + (n.lat || 0), 0) / cluster.nodes.length;
    const centerLng = cluster.nodes.reduce((sum, n) => sum + (n.lng || 0), 0) / cluster.nodes.length;
    
    // País/ciudad más común en el cluster
    const countries = cluster.nodes.map(n => n.country).filter((c): c is string => Boolean(c));
    const cities = cluster.nodes.map(n => n.city).filter((c): c is string => Boolean(c));
    const mostCommonCountry = getMostCommon(countries);
    const mostCommonCity = getMostCommon(cities);
    
    // Calcular intensidad combinada (latencia + densidad)
    const baseIntensity = calculateIntensity(avgLatency);
    // Boost AGRESIVO de intensidad según número de nodos
    // 1 nodo = +0.05, 5 nodos = +0.15, 10 nodos = +0.25, 20+ nodos = +0.35
    let densityBoost = Math.min(0.35, Math.log2(cluster.nodes.length + 1) * 0.1);
    
    // MEGA BOOST para clusters críticos - que sean IMPOSIBLES de ignorar
    if (avgLatency >= 5) {
      densityBoost += 0.3; // Boost extra para problemas críticos
    } else if (avgLatency >= 3) {
      densityBoost += 0.15; // Boost para problemas moderados
    }
    
    const finalIntensity = Math.min(1.0, baseIntensity + densityBoost);
    
    points.push({
      lat: centerLat,
      lng: centerLng,
      intensity: finalIntensity,
      value: avgLatency,
      color: getHeatColor(avgLatency),
      nodes: cluster.nodes.map(n => n.pubkey).filter((p): p is string => Boolean(p)),
      country: mostCommonCountry,
      city: mostCommonCity
    });
  });
  
  return points;
}

/**
 * Agrupa nodos por proximidad geográfica
 */
function clusterByProximity(nodes: PNode[], radiusKm: number): ClusterInfo[] {
  const clusters: ClusterInfo[] = [];
  const used = new Set<string>();
  const now = Date.now();
  
  nodes.forEach(node => {
    if (!node.lat || !node.lng || !node.pubkey || used.has(node.pubkey)) return;
    
    const clusterNodes = [node];
    used.add(node.pubkey!);
    
    // Encontrar nodos cercanos
    nodes.forEach(other => {
      if (!other.lat || !other.lng || !other.pubkey || used.has(other.pubkey)) return;
      
      const distance = calculateDistance(
        node.lat!,
        node.lng!,
        other.lat!,
        other.lng!
      );
      
      if (distance <= radiusKm) {
        clusterNodes.push(other);
        used.add(other.pubkey!);
      }
    });
    
    // Calcular información del cluster
    const centerLat = clusterNodes.reduce((sum, n) => sum + (n.lat || 0), 0) / clusterNodes.length;
    const centerLng = clusterNodes.reduce((sum, n) => sum + (n.lng || 0), 0) / clusterNodes.length;
    
    const avgLatency = clusterNodes.reduce((sum, node) => {
      const minutesAgo = (now - node.lastSeen.getTime()) / 1000 / 60;
      return sum + minutesAgo;
    }, 0) / clusterNodes.length;
    
    clusters.push({
      nodes: clusterNodes,
      center: { lat: centerLat, lng: centerLng },
      avgLatency,
      status: getStatusFromLatency(avgLatency)
    });
  });
  
  return clusters;
}

/**
 * Calcula distancia entre dos coordenadas en km
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convierte grados a radianes
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calcula intensidad del heat map (0-1)
 * Escala ULTRA dramática para máxima diferenciación visual
 * Incluso pequeñas diferencias en latencia se ven claramente
 */
function calculateIntensity(latencyMinutes: number): number {
  // Escala exponencial - super sensible a cambios pequeños
  // 0-0.1 min = 0.15 (verde muy bajo)
  // 0.1-0.3 min = 0.25 (verde bajo)
  // 0.3-0.5 min = 0.35 (verde medio)
  // 0.5-1 min = 0.45 (verde-amarillo)
  // 1-1.5 min = 0.55 (amarillo)
  // 1.5-2 min = 0.65 (amarillo-naranja)
  // 2-3 min = 0.75 (naranja)
  // 3-5 min = 0.85 (naranja-rojo)
  // 5+ min = 0.95-1.0 (rojo)
  
  if (latencyMinutes < 0.1) return 0.15;
  if (latencyMinutes < 0.3) return 0.25;
  if (latencyMinutes < 0.5) return 0.35;
  if (latencyMinutes < 1) return 0.45;
  if (latencyMinutes < 1.5) return 0.55;
  if (latencyMinutes < 2) return 0.65;
  if (latencyMinutes < 3) return 0.75;
  if (latencyMinutes < 5) return 0.85;
  return 0.95 + Math.min(0.05, (latencyMinutes - 5) / 100);
}

/**
 * Obtiene color según latencia
 */
export function getHeatColor(latencyMinutes: number): string {
  if (latencyMinutes < 1) return '#22c55e'; // Verde - Excelente
  if (latencyMinutes < 3) return '#eab308'; // Amarillo - Bueno
  if (latencyMinutes < 5) return '#f97316'; // Naranja - Regular
  return '#ef4444'; // Rojo - Crítico
}

/**
 * Obtiene status según latencia
 */
export function getStatusFromLatency(latencyMinutes: number): 'excellent' | 'good' | 'fair' | 'critical' {
  if (latencyMinutes < 1) return 'excellent';
  if (latencyMinutes < 3) return 'good';
  if (latencyMinutes < 5) return 'fair';
  return 'critical';
}

/**
 * Obtiene label de status
 */
export function getStatusLabel(latencyMinutes: number): string {
  if (latencyMinutes < 1) return '✅ Excellent';
  if (latencyMinutes < 3) return '🟡 Good';
  if (latencyMinutes < 5) return '🟠 Fair';
  return '🔴 Critical';
}

/**
 * Encuentra el elemento más común en un array
 */
function getMostCommon(arr: string[]): string | undefined {
  if (arr.length === 0) return undefined;
  
  const counts = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
}
