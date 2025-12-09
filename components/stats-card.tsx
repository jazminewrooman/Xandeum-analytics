'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  index?: number;
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, index = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="bg-white rounded-xl border border-[var(--border)] p-6 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-1">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)]">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm font-medium ${
              trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
