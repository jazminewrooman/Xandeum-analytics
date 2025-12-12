'use client';

import { NetworkSnapshot } from '@/lib/types/snapshot';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, TrendingUp, Clock } from 'lucide-react';

interface NetworkChartProps {
  snapshots: NetworkSnapshot[];
  timeRangeHours: number;
}

export function NetworkChart({ snapshots, timeRangeHours }: NetworkChartProps) {
  if (snapshots.length < 2) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Network Health Over Time</h3>
            <p className="text-xs text-gray-500">Historical trends</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Collecting data...</p>
            <p className="text-xs">Historical trends will appear after a few snapshots</p>
          </div>
        </div>
      </div>
    );
  }

  // Format data for chart
  const chartData = snapshots.map(snapshot => ({
    time: new Date(snapshot.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    timestamp: snapshot.timestamp,
    health: snapshot.healthScore,
    online: snapshot.onlineNodes,
    total: snapshot.totalNodes,
    geocoded: snapshot.geocodedNodes
  }));

  // Calculate trends
  const latestHealth = snapshots[snapshots.length - 1].healthScore;
  const previousHealth = snapshots[Math.max(0, snapshots.length - 10)]?.healthScore || latestHealth;
  const healthTrend = latestHealth - previousHealth;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Network Health Over Time</h3>
            <p className="text-xs text-gray-500">
              Last {timeRangeHours.toFixed(1)}h • {snapshots.length} snapshots
            </p>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
          healthTrend > 0 ? 'bg-green-100 text-green-700' :
          healthTrend < 0 ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          <TrendingUp className={`w-3 h-3 ${healthTrend < 0 ? 'rotate-180' : ''}`} />
          {healthTrend > 0 ? '+' : ''}{healthTrend.toFixed(0)}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 11 }}
            stroke="#999"
            interval={Math.floor(chartData.length / 6)}
          />
          <YAxis 
            tick={{ fontSize: 11 }}
            stroke="#999"
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: any, name: string) => {
              if (name === 'health') return [`${value}`, 'Health Score'];
              if (name === 'online') return [`${value} nodes`, 'Online'];
              if (name === 'geocoded') return [`${value} nodes`, 'Geocoded'];
              return [value, name];
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="health" 
            stroke="#9333ea" 
            strokeWidth={3}
            dot={false}
            name="Health Score"
          />
          <Line 
            type="monotone" 
            dataKey="online" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
            name="Online Nodes"
          />
          <Line 
            type="monotone" 
            dataKey="geocoded" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            name="Geocoded"
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{latestHealth}</p>
          <p className="text-xs text-gray-500">Current Health</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {chartData[chartData.length - 1]?.online || 0}
          </p>
          <p className="text-xs text-gray-500">Nodes Online</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {chartData[chartData.length - 1]?.geocoded || 0}
          </p>
          <p className="text-xs text-gray-500">Geocoded</p>
        </div>
      </div>
    </div>
  );
}
