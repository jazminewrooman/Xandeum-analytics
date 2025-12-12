'use client';

import { PNode } from '@/lib/types/pnode';
import { X } from 'lucide-react';

interface CountryStatsSidebarProps {
  nodes: PNode[];
  isOpen: boolean;
  onClose: () => void;
}

export function CountryStatsSidebar({ nodes, isOpen, onClose }: CountryStatsSidebarProps) {
  // Validar y filtrar nodos
  const geoNodes = nodes.filter(n => n && n.country && typeof n.country === 'string');
  
  if (geoNodes.length === 0) {
    return null; // No mostrar sidebar si no hay datos
  }
  
  // Count by country
  const countryStats = geoNodes.reduce((acc, node) => {
    const country = node.country || 'Unknown';
    if (!acc[country]) {
      acc[country] = { count: 0, countryCode: node.countryCode };
    }
    acc[country].count++;
    return acc;
  }, {} as Record<string, { count: number; countryCode?: string }>);

  // Sort by count
  const sortedCountries = Object.entries(countryStats)
    .filter(([country, stats]) => country && stats && stats.count > 0)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10); // Top 10

  const maxCount = sortedCountries[0]?.[1]?.count || 1;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:relative md:w-72 lg:w-80 md:shadow-lg
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Geographic Distribution
              </h2>
              <p className="text-xs text-gray-500">Top 10 Countries</p>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Country List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sortedCountries.map(([country, stats], idx) => {
              const percentage = (stats.count / geoNodes.length) * 100;
              const barWidth = (stats.count / maxCount) * 100;
              
              return (
                <div key={country} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {stats.countryCode && stats.countryCode.length === 2 && (
                        <span className="text-lg" role="img" aria-label={country}>
                          {(() => {
                            try {
                              const code = stats.countryCode.toUpperCase();
                              return String.fromCodePoint(
                                0x1F1E6 - 65 + code.charCodeAt(0),
                                0x1F1E6 - 65 + code.charCodeAt(1)
                              );
                            } catch {
                              return '🌍';
                            }
                          })()}
                        </span>
                      )}
                      <span className="font-medium text-gray-900">{country}</span>
                    </div>
                    <span className="text-gray-600 font-semibold">{stats.count}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                        idx === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                        idx === 2 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {percentage.toFixed(1)}% of total
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
