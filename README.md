# 💜 Xandeum Network Analytics

A modern analytics dashboard for monitoring Xandeum pNodes in real-time. Built with Next.js 14, TypeScript, and TailwindCSS with a clean light theme and purple accents.

![License](https://img.shields.io/badge/license-MIT-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

- 📊 **Real-time pNode Monitoring** - Track all pNodes in the Xandeum network
- 🔄 **Multi-Version Support** - Compatible with both v0.6 and v0.7 pRPC API
- 🎨 **Modern UI** - Clean light theme with purple/pink accents
- ⚡ **Live Updates** - Data refreshes automatically every 60 seconds
- 🔍 **Advanced Search & Filtering** - Find nodes by address, pubkey, or version
- 📈 **Statistics Dashboard** - Total nodes, storage, uptime, and version distribution
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

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS + CSS Variables
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Charts:** Recharts (ready to use)
- **Maps:** React Leaflet (ready to use)

## 📁 Project Structure

```
xandeum-analytics/
├── app/
│   ├── page.tsx              # Main dashboard page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles & theme
├── components/
│   ├── stats-card.tsx        # Statistics cards
│   └── node-table.tsx        # Nodes table with search
├── lib/
│   ├── types/
│   │   └── pnode.ts          # TypeScript interfaces
│   ├── adapters/
│   │   ├── types.ts          # Adapter interfaces
│   │   ├── v06-adapter.ts    # v0.6 API adapter
│   │   └── v07-adapter.ts    # v0.7 API adapter
│   ├── api-client.ts         # Main API client
│   └── utils.ts              # Helper functions
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
