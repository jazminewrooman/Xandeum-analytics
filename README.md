# 💜 Xandeum Network Analytics

A modern analytics dashboard for monitoring Xandeum pNodes in real-time. Built with Next.js 14, TypeScript, and TailwindCSS with a clean light theme and purple accents.

![License](https://img.shields.io/badge/license-MIT-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

- 📊 **Real-time pNode Monitoring** - Track all pNodes in the Xandeum network
- 🗺️ **Interactive Map View** - Visualize node distribution with IP geolocation
- 📈 **Historical Data Tracking** - Network snapshots every 30 seconds stored locally
- 📉 **Performance Charts** - Health score, online nodes, and geographic trends over time
- 💾 **Client-Side Persistence** - LocalStorage keeps your data across sessions
- 🔄 **Multi-Version Support** - Compatible with both v0.6 and v0.7 pRPC API
- 🎨 **Modern UI** - Clean light theme with purple/pink accents
- ⚡ **Live Updates** - Data refreshes automatically every 30 seconds
- 🔍 **Advanced Search & Filtering** - Find nodes by address, pubkey, or version
- 🌐 **Geographic Distribution** - Country-wise node statistics and clustering
- 🌐 **Netlify/Vercel Ready** - Deploy with one click
- ♿ **Accessible** - WCAG compliant, keyboard navigation

## 🏗️ Architecture

The project uses a flexible adapter pattern to support multiple pRPC API versions:

```
┌─────────────────────────────────┐
│   UI Components                 │
│   (Version-agnostic)            │
└──────────────┬──────────────────┘
               │
         API Client Layer
               │
        ┌──────┴──────┐
        │             │
   V0.6 Adapter   V0.7 Adapter
   (get-pods)    (get-pods-with-stats)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Access to a pRPC endpoint (public or your own pNode)

### Installation

1. **Clone and install dependencies:**

```bash
cd xandeum-analytics
npm install
```

2. **Configure environment variables:**

Create a `.env.local` file in the root directory:

```bash
# RPC Endpoint URL
NEXT_PUBLIC_RPC_URL=http://207.244.255.1:6000

# API Version (0.6 or 0.7)
NEXT_PUBLIC_API_VERSION=0.7

# Optional: Request timeout in milliseconds
NEXT_PUBLIC_TIMEOUT=10000
```

3. **Run the development server:**

```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## ⚙️ Configuration

### Switching Between API Versions

The dashboard supports both pRPC API versions seamlessly:

**For v0.7 (New - Recommended):**
```env
NEXT_PUBLIC_API_VERSION=0.7
```
- Single endpoint: `get-pods-with-stats`
- Includes storage, uptime, and performance stats

**For v0.6 (Legacy):**
```env
NEXT_PUBLIC_API_VERSION=0.6
```
- Endpoint: `get-pods`
- Basic node information only

### Using Your Own pNode

If you're running your own pNode:

```env
NEXT_PUBLIC_RPC_URL=http://localhost:6000
NEXT_PUBLIC_API_VERSION=0.7
```

## 💾 Data Persistence & LocalStorage

The dashboard uses **browser localStorage** to persist historical network data across sessions. This provides several benefits:

### How It Works

- **Automatic Snapshots:** Network state is captured every 30 seconds
- **Client-Side Storage:** Data is stored in your browser's localStorage
- **Persistent Across Sessions:** Data survives page refreshes and browser restarts
- **Storage Key:** `xandeum_network_snapshots`
- **Retention:** Last 480 snapshots (~4 hours at 30-second intervals)

### What Gets Stored

Each snapshot includes:
- Total nodes count
- Online nodes count
- Geocoded nodes count
- Average response time
- Version distribution
- Countries count
- Network health score (0-100)

### Data Size

Approximate storage usage:
- **Per snapshot:** ~500 bytes
- **480 snapshots:** ~240 KB
- **Well within limits:** Most browsers allow 5-10 MB per domain

### Managing LocalStorage

**View stored data:**
```javascript
// Open browser console (F12) and run:
JSON.parse(localStorage.getItem('xandeum_network_snapshots'))
```

**Clear stored data:**
```javascript
// Option 1: Via console
localStorage.removeItem('xandeum_network_snapshots')

// Option 2: Clear all site data
// Browser Settings → Clear Site Data → localhost:3000
```

**Automatic cleanup:**
- Old snapshots are automatically removed when limit (480) is reached
- Only the most recent 4 hours of data is kept

### Privacy & Security

- ✅ **Local only:** Data never leaves your browser
- ✅ **No server storage:** No backend database required
- ✅ **No tracking:** No analytics or telemetry
- ✅ **User control:** You can clear data anytime
- ⚠️ **Not shared:** Data is per-browser, not synced across devices

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS + CSS Variables
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Charts:** Recharts (network health & trends)
- **Maps:** React Leaflet + Leaflet.heat (geographic visualization)
- **Geolocation:** ip-api.com (IP to coordinates)
- **State Management:** React Hooks + Context
- **Data Persistence:** Browser LocalStorage

## 📁 Project Structure

```
xandeum-analytics/
├── app/
│   ├── page.tsx              # Main dashboard page (Map/List views)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles & theme
│   └── api/
│       └── nodes-geo/
│           └── route.ts      # Geocoding API endpoint
├── components/
│   ├── stats-card.tsx        # Statistics cards
│   ├── node-table.tsx        # Nodes table with search
│   ├── world-map.tsx         # Interactive Leaflet map
│   ├── map-stats-overlay.tsx # Floating stats on map
│   ├── country-stats-sidebar.tsx # Geographic distribution
│   └── network-chart.tsx     # Recharts visualization
├── hooks/
│   └── useNetworkSnapshots.ts # Historical data management
├── lib/
│   ├── types/
│   │   ├── pnode.ts          # TypeScript interfaces
│   │   └── snapshot.ts       # Snapshot data types
│   ├── adapters/
│   │   ├── types.ts          # Adapter interfaces
│   │   ├── v06-adapter.ts    # v0.6 API adapter
│   │   └── v07-adapter.ts    # v0.7 API adapter
│   ├── api-client.ts         # Main API client
│   ├── geocoding.ts          # IP to location service
│   └── utils.ts              # Helper functions
├── public/
│   └── logo.png              # Xandeum logo
└── .env.local                # Configuration (create this)
```

## 🎨 Customization

### Theme Colors

Edit `app/globals.css` to customize the color palette:

```css
:root {
  --primary: #8B5CF6;      /* Purple */
  --secondary: #EC4899;    /* Pink */
  --accent: #06B6D4;       /* Cyan */
  /* ... more colors */
}
```

### Dark Mode

Dark mode is automatically enabled based on system preferences. To force light mode, remove the `@media (prefers-color-scheme: dark)` section in `globals.css`.

## 🚢 Deployment

### Deploy to Netlify

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "Import from Git"
4. Select your repository
5. Add environment variables:
   - `NEXT_PUBLIC_RPC_URL`
   - `NEXT_PUBLIC_API_VERSION`
6. Deploy! 🎉

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/xandeum-analytics)

1. Click the button above or push to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy automatically

## 📊 API Reference

### V0.7 API (New)

**Method:** `get-pods-with-stats`

Returns all pNodes with detailed statistics including storage, uptime, and performance metrics.

### V0.6 API (Legacy)

**Method:** `get-pods`

Returns basic pNode information (address, pubkey, version, last seen).

## 🔧 Troubleshooting

### No Historical Data Showing

If the charts are empty:
1. **Wait 1-2 minutes** - Snapshots are taken every 30 seconds
2. **Check localStorage** - Open console and run:
   ```javascript
   localStorage.getItem('xandeum_network_snapshots')
   ```
3. **Clear and restart** - If corrupted:
   ```javascript
   localStorage.clear()
   // Then refresh the page
   ```

### Geocoding Issues

If nodes aren't showing on the map:
- **Rate limiting:** Free tier allows 45 requests/minute
- **Incremental loading:** 15 IPs are geocoded per refresh
- **Be patient:** 151 nodes take ~10 refreshes (~5 minutes)
- **Check progress:** Header shows "X/151 geocoded"

### Performance Issues

If the dashboard is slow:
- **Clear old snapshots:**
  ```javascript
  localStorage.removeItem('xandeum_network_snapshots')
  ```
- **Reduce refresh rate:** Edit `app/page.tsx` line 70:
  ```typescript
  const interval = setInterval(fetchData, 60000); // 60 seconds instead of 30
  ```
- **Disable auto-refresh:** Comment out the useEffect in `app/page.tsx`

### Browser Compatibility

LocalStorage works on:
- ✅ Chrome/Edge 4+
- ✅ Firefox 3.5+
- ✅ Safari 4+
- ✅ Opera 10.50+
- ❌ Incognito/Private mode (data clears on close)

## 🤝 Contributing

Contributions are welcome! This project was built for the Xandeum pNode Analytics Bounty.

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Acknowledgments

- Built for [Xandeum Network](https://xandeum.network)
- Inspired by modern data dashboards like Vercel Analytics and Linear
- Thanks to the Xandeum Discord community for testing and feedback

---

**Made with 💜 for the Xandeum ecosystem**
