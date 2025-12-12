# 📸 Network Snapshots System

## Overview

The dashboard now includes a **real-time historical tracking system** that captures network state every 30 seconds and displays trends over time.

## How It Works

### 1. Data Collection
- **Interval**: Every 30 seconds
- **Storage**: Browser localStorage
- **Retention**: Last 480 snapshots (~4 hours)
- **Auto-cleanup**: Older snapshots automatically removed

### 2. What Gets Captured

Each snapshot includes:
```typescript
{
  timestamp: number;           // When snapshot was taken
  totalNodes: number;          // Total nodes in network
  onlineNodes: number;         // Nodes online (< 5 min ago)
  geocodedNodes: number;       // Nodes with location data
  avgResponseTime: number;     // Average minutes since last seen
  versionDistribution: {};     // Version -> count mapping
  countries: number;           // Unique countries
  healthScore: number;         // 0-100 health score
}
```

### 3. Health Score Calculation

```
Health Score = (Availability × 50%) + (Response × 30%) + (Geocoding × 20%)

Where:
- Availability = % of nodes online
- Response = Score based on avg response time
- Geocoding = % of nodes with location data
```

## Features

### 📊 Network Chart
- **Line graph** showing health score over time
- **Multiple metrics**: Health, Online nodes, Geocoded nodes
- **Trend indicator**: Shows if network health is improving or declining
- **Stats summary**: Current values at a glance

### 🗺️ Map View
- Chart displayed **above the map**
- Scrollable section for historical data
- Live map below with current node positions

### 📋 List View
- Chart displayed **above the table**
- Full width for better visibility
- Node table below for detailed inspection

## Storage Details

- **Key**: `xandeum_network_snapshots`
- **Location**: `localStorage`
- **Size**: ~50KB for 480 snapshots
- **Persistence**: Until browser cache is cleared

## Benefits

1. **Trend Analysis** 📈
   - See how network health changes over time
   - Identify patterns and issues

2. **No Backend Required** 💰
   - Pure frontend solution
   - No database costs
   - Works immediately

3. **Privacy Friendly** 🔒
   - Data stays in your browser
   - No server-side tracking
   - Each user has their own history

4. **Performance** ⚡
   - Minimal overhead
   - Efficient storage
   - Smooth animations

## Future Enhancements

Potential improvements:
- [ ] Export snapshots to CSV/JSON
- [ ] Compare timeframes
- [ ] Alerts for health drops
- [ ] Longer retention (migrate to IndexedDB)
- [ ] Backend sync for shared history

## Development

### Files Created
```
lib/types/snapshot.ts          # TypeScript types
hooks/useNetworkSnapshots.ts   # Snapshot management hook
components/network-chart.tsx   # Chart visualization
```

### Dependencies
- `recharts` - Chart library (already installed)
- React hooks for state management
- localStorage API for persistence

## Testing

To test the system:
1. Start the dashboard
2. Wait 1-2 minutes for snapshots to accumulate
3. Observe the chart filling with data
4. Check localStorage in DevTools
5. Refresh page - data should persist

## Troubleshooting

**Chart not showing?**
- Need at least 2 snapshots (wait 30 seconds)
- Check browser console for errors

**Data lost on refresh?**
- Check if localStorage is enabled
- Verify quota isn't exceeded

**Chart looks weird?**
- Clear localStorage and restart
- Check if nodes data is valid
