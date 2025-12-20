# 🔥 Performance Heat Map - Technical Documentation

## Overview

The Performance Heat Map is an advanced visualization feature that provides geographic performance analysis of the Xandeum pNode network. It automatically detects anomalies, clusters nodes by location, and visually represents network health using color-coded heat overlays.

## Architecture

### Component Structure

```
components/
└── performance-heatmap.tsx
    ├── PerformanceHeatMap (Main Component)
    └── HeatMapLayer (Leaflet Integration)

lib/
└── heatmap-calculator.ts
    ├── calculateHeatMap()
    ├── clusterByProximity()
    ├── calculateIntensity()
    └── getHeatColor()
```

### Data Flow

```
PNode[] (227 nodes)
    ↓
calculateHeatMap()
    ↓
Clustering (100km radius)
    ↓
HeatMapPoint[] (30 clusters)
    ↓
Intensity Calculation
    ↓
Leaflet.heat Layer
    ↓
Visual Rendering
```

## Algorithm Details

### 1. Clustering Algorithm

**File:** `lib/heatmap-calculator.ts` → `clusterByProximity()`

```typescript
Input: PNode[] with lat/lng
Radius: 100km
Algorithm: Greedy clustering

Steps:
1. For each unclustered node:
   - Find all nodes within 100km
   - Create cluster with all found nodes
   - Mark all as used
2. Calculate cluster center (average lat/lng)
3. Calculate average latency
4. Determine cluster status
```

**Distance Calculation:**
- Uses Haversine formula
- Earth radius: 6371 km
- Accurate for geographic coordinates

### 2. Intensity Calculation

**Formula:**
```typescript
Base Intensity = f(latency)
Density Boost = log2(nodeCount) * 0.1
Critical Boost = latency >= 5 ? 0.3 : (latency >= 3 ? 0.15 : 0)

Final Intensity = min(1.0, baseIntensity + densityBoost + criticalBoost)
```

**Intensity Scale:**
| Latency (min) | Base Intensity | Color |
|--------------|----------------|-------|
| 0.0 - 0.1 | 0.15 | Very light green |
| 0.1 - 0.3 | 0.25 | Light green |
| 0.3 - 0.5 | 0.35 | Green |
| 0.5 - 1.0 | 0.45 | Yellow-green |
| 1.0 - 1.5 | 0.55 | Yellow |
| 1.5 - 2.0 | 0.65 | Yellow-orange |
| 2.0 - 3.0 | 0.75 | Orange |
| 3.0 - 5.0 | 0.85 | Red-orange |
| 5.0+ | 0.95-1.00 | Deep red |

### 3. Heat Layer Rendering

**Leaflet.heat Configuration:**
```typescript
{
  radius: 50,           // Heat blob size
  blur: 60,             // Blur amount
  maxZoom: 15,          // Visible at all zoom levels
  max: 0.4,             // Sensitivity (lower = more sensitive)
  minOpacity: 0.4,      // Always visible
  gradient: {
    0.0: 'rgba(16, 185, 129, 0)',  // Transparent
    0.15: '#10b981',    // Green
    0.25: '#22c55e',
    0.35: '#84cc16',    // Lime
    0.45: '#fbbf24',    // Yellow
    0.55: '#fb923c',    // Orange light
    0.65: '#f97316',    // Orange
    0.75: '#ef4444',    // Red
    0.85: '#dc2626',    // Red dark
    1.0: '#991b1b'      // Red very dark
  }
}
```

## Performance Optimization

### Memory Usage
- **Node data:** ~1KB per node × 227 = ~227KB
- **Cluster data:** ~500B per cluster × 30 = ~15KB
- **Heat layer:** Rendered via Canvas (GPU accelerated)
- **Total:** < 300KB in memory

### Rendering Performance
- **Initial render:** ~100ms (clustering + calculation)
- **Heat layer update:** ~50ms (Leaflet.heat)
- **Marker rendering:** ~10ms per 30 markers
- **Total:** < 200ms for full update

### Update Frequency
- **Auto-refresh:** 30 seconds (synced with data fetch)
- **Manual refresh:** On-demand via refresh button
- **Lazy calculation:** Only when view is active

## Anomaly Detection Logic

### Critical Node Detection

```typescript
Critical = latency >= 5 minutes

Interpretation:
- Node hasn't responded in 5+ minutes
- Likely offline or severe network issues
- Requires immediate attention
```

### Fair Node Detection

```typescript
Fair = 3 <= latency < 5 minutes

Interpretation:
- Degraded performance
- Potential issues developing
- Should be monitored
```

### Good/Excellent Detection

```typescript
Good = 1 <= latency < 3 minutes
Excellent = latency < 1 minute

Interpretation:
- Normal operation
- Healthy nodes
```

## Marker Size Calculation

```typescript
Base Size:
- Normal: 8px
- Fair: 10px
- Critical: 12px

Dynamic Boost:
sizeBoost = min(8, log2(nodeCount + 1) * 2)

Final Size = baseSize + sizeBoost

Examples:
1 node:  8px + 1px = 9px
5 nodes: 8px + 4.6px = 12.6px
10 nodes: 8px + 6.6px = 14.6px
30 nodes (critical): 12px + 10px = 22px (capped at 20px)
```

## Console Logging

### Debug Information

```javascript
🔥 Heat Map Debug:
Total nodes: 227           // Total geocoded nodes
Heat points: 30            // Number of clusters created
Latency range: 0.07 - 50.40 min   // Min/max response time
Average latency: 8.02 min  // Network-wide average
Intensity range: 0.25 - 1.00      // Calculated intensities
Average intensity: 0.57    // Mean intensity
Distribution:              // Performance breakdown
  Excellent=22
  Good=1
  Fair=0
  Critical=7

Top 3 largest clusters:    // Biggest clusters by node count
[
  {
    location: 'St Louis, United States',
    nodes: 30,
    latency: '17.61',
    intensity: '1.00',
    color: '#ef4444'
  },
  ...
]

⚠️ CRITICAL CLUSTERS:      // All critical clusters
[
  {
    location: 'St Louis, United States',
    nodes: 30,
    latency: '17.61',
    intensity: '1.00',
    status: '🔴 OFFLINE/CRITICAL'
  },
  ...
]
```

## UI Components

### Stats Badge

**Location:** Top-right corner

**Content:**
```
┌─────────────────────────┐
│ ⚠️ 7 Critical Alerts    │ ← Shown only if critical > 0
│ Performance Status      │
│ 227 nodes              │
│                        │
│ 🟢 Excellent: 125      │
│ 🟡 Good: 95            │
│ 🟠 Fair: 0             │
│ 🔴 Critical: 7         │ ← Highlighted if > 0
└─────────────────────────┘
```

### Legend

**Location:** Bottom-left corner

**Content:**
```
🔥 Performance Heat Map

🟢 Excellent (< 1 min)
🟡 Good (1-3 min)
🟠 Fair (3-5 min)
🔴 Critical (> 5 min)

💡 Brighter areas = slower response
📍 Larger circles = more nodes
```

### Popup Information

**Triggered by:** Click on marker

**Content:**
```
┌──────────────────────────┐
│ 🔴 CRITICAL Cluster      │ ← Color-coded header
├──────────────────────────┤
│ 📍 St Louis, US          │
│ 🖥️ Nodes: 30            │
│ ⏱️ Avg Latency: 17.6 min │
│ 📊 Status: 🔴 Critical   │
│                          │
│ ⚠️ Alert:                │
│ Some nodes may be offline│
└──────────────────────────┘
```

## Integration Points

### With Map View
- Shares same geocoding data
- Uses same node data source
- Same refresh mechanism
- Different visualization approach

### With List View
- Both show same node count
- List provides detailed drill-down
- Heat map provides visual overview

### With Charts
- Historical data complements heat map
- Heat map shows current state
- Charts show trends over time

## Customization Options

### Adjusting Clustering Radius

```typescript
// lib/heatmap-calculator.ts
const clusters = clusterByProximity(geoNodes, 100); // Change radius here
```

**Effect:**
- Smaller radius (50km): More clusters, more granular
- Larger radius (200km): Fewer clusters, broader view

### Adjusting Sensitivity

```typescript
// components/performance-heatmap.tsx
HeatLayer(heatData, {
  max: 0.4,  // Lower = more sensitive (0.3-0.5 recommended)
})
```

**Effect:**
- Lower max: More dramatic color differences
- Higher max: More subtle color differences

### Adjusting Thresholds

```typescript
// lib/heatmap-calculator.ts
if (latencyMinutes < 1) return '#22c55e';  // Excellent
if (latencyMinutes < 3) return '#eab308';  // Good
if (latencyMinutes < 5) return '#f97316';  // Fair
return '#ef4444';                           // Critical
```

## Browser Compatibility

| Browser | Version | Heat Map | Clustering | Markers |
|---------|---------|----------|------------|---------|
| Chrome | 80+ | ✅ | ✅ | ✅ |
| Firefox | 75+ | ✅ | ✅ | ✅ |
| Safari | 13+ | ✅ | ✅ | ✅ |
| Edge | 80+ | ✅ | ✅ | ✅ |

**Requirements:**
- Canvas support
- ES6 JavaScript
- CSS transforms
- LocalStorage (for caching)

## Future Enhancements

### Planned Features
- [ ] Time-based heat map replay
- [ ] Export heat map as image
- [ ] Custom threshold configuration
- [ ] Heat map overlays (combine with other data)
- [ ] Predictive heat map (ML-based)

### Potential Improvements
- [ ] WebGL rendering for better performance
- [ ] Real-time WebSocket updates
- [ ] Mobile gesture support
- [ ] Heat map animation transitions
- [ ] Historical heat map comparison

## Troubleshooting

### Heat map not showing
1. Check node count: `console.log(nodes.length)`
2. Check geocoded count: `console.log(geoNodes.length)`
3. Verify Leaflet.heat loaded: `console.log(HeatLayer)`

### Colors too similar
1. Adjust sensitivity: Lower `max` value
2. Increase intensity boost: Modify density/critical boosts
3. Change gradient colors: Modify color stops

### Performance issues
1. Reduce auto-refresh rate
2. Limit node count displayed
3. Disable auto-refresh when not in view

---

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Maintainer:** Xandeum Analytics Team
