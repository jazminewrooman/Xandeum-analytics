'use client';

import { useState } from 'react';
import { PNode } from '@/lib/types/pnode';
import { formatBytes, formatUptime, formatPercent, timeAgo, getNodeStatus } from '@/lib/utils';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface NodeTableProps {
  nodes: PNode[];
}

type SortField = 'address' | 'version' | 'storage' | 'uptime' | 'lastSeen';
type SortDirection = 'asc' | 'desc';

export function NodeTable({ nodes }: NodeTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastSeen');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter nodes
  const filteredNodes = nodes.filter(node =>
    node.address.toLowerCase().includes(search.toLowerCase()) ||
    node.pubkey?.toLowerCase().includes(search.toLowerCase()) ||
    node.version.toLowerCase().includes(search.toLowerCase())
  );

  // Sort nodes
  const sortedNodes = [...filteredNodes].sort((a, b) => {
    let aVal, bVal;

    switch (sortField) {
      case 'address':
        aVal = a.address;
        bVal = b.address;
        break;
      case 'version':
        aVal = a.version;
        bVal = b.version;
        break;
      case 'storage':
        aVal = a.storageUsed || 0;
        bVal = b.storageUsed || 0;
        break;
      case 'uptime':
        aVal = a.uptime || 0;
        bVal = b.uptime || 0;
        break;
      case 'lastSeen':
      default:
        aVal = a.lastSeen.getTime();
        bVal = b.lastSeen.getTime();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header with search */}
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            All pNodes
          </h2>
          <span className="text-sm text-[var(--text-secondary)]">
            {filteredNodes.length} of {nodes.length} nodes
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
          <input
            type="text"
            placeholder="Search by address, pubkey, or version..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--surface)]">
            <tr>
              <th 
                onClick={() => handleSort('address')}
                className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--primary)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  Address
                  <SortIcon field="address" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('version')}
                className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--primary)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  Version
                  <SortIcon field="version" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('storage')}
                className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--primary)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  Storage
                  <SortIcon field="storage" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('uptime')}
                className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--primary)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  Uptime
                  <SortIcon field="uptime" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('lastSeen')}
                className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--primary)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  Last Seen
                  <SortIcon field="lastSeen" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sortedNodes.map((node, index) => {
              const status = getNodeStatus(node.lastSeen);
              return (
                <motion.tr
                  key={node.address}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-[var(--surface)] transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {node.address}
                      </div>
                      {node.pubkey && (
                        <div className="text-xs text-[var(--text-muted)] font-mono">
                          {node.pubkey.slice(0, 8)}...{node.pubkey.slice(-6)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--lavender)] text-[var(--primary)]">
                      {node.version}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                    {node.storageUsed ? (
                      <div>
                        <div>{formatBytes(node.storageUsed)}</div>
                        {node.storageUsagePercent && (
                          <div className="text-xs text-[var(--text-muted)]">
                            {formatPercent(node.storageUsagePercent)} used
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[var(--text-muted)]">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                    {node.uptime ? formatUptime(node.uptime) : <span className="text-[var(--text-muted)]">N/A</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                    {timeAgo(node.lastSeen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                      status === 'online' ? 'bg-[var(--mint)] text-[var(--success)]' :
                      status === 'warning' ? 'bg-[var(--peach)] text-[var(--warning)]' :
                      'bg-[var(--rose)] text-[var(--danger)]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        status === 'online' ? 'bg-[var(--success)]' :
                        status === 'warning' ? 'bg-[var(--warning)]' :
                        'bg-[var(--danger)]'
                      }`}></span>
                      {status === 'online' ? 'Online' : status === 'warning' ? 'Warning' : 'Offline'}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredNodes.length === 0 && (
        <div className="p-12 text-center text-[var(--text-muted)]">
          No nodes found matching your search.
        </div>
      )}
    </div>
  );
}
