'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

const revenueData = [
  { date: 'Jan', revenue: 2400, transactions: 240 },
  { date: 'Feb', revenue: 1398, transactions: 221 },
  { date: 'Mar', revenue: 9800, transactions: 229 },
  { date: 'Apr', revenue: 3908, transactions: 200 },
  { date: 'May', revenue: 4800, transactions: 218 },
  { date: 'Jun', revenue: 3800, transactions: 250 },
];

const transactionData = [
  { name: 'ACH', value: 4000 },
  { name: 'Wire', value: 3000 },
  { name: 'Card', value: 2000 },
  { name: 'Check', value: 2780 },
];

export function ChartCard() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#f5f7fa' : '#0f172a';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const primaryColor = '#1bc47d';

  if (!mounted) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="glass-effect rounded-2xl p-6 border border-border"
      >
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-1">Revenue Trend</h3>
          <p className="text-sm text-muted-foreground">Last 6 months performance</p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" stroke={textColor} style={{ fontSize: '12px' }} />
            <YAxis stroke={textColor} style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#111b27' : '#f5f7fa',
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
                color: textColor,
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={primaryColor}
              strokeWidth={2}
              dot={{ fill: primaryColor, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="transactions"
              stroke={isDark ? '#64748b' : '#94a3b8'}
              strokeWidth={2}
              dot={{ fill: isDark ? '#64748b' : '#94a3b8', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="glass-effect rounded-2xl p-6 border border-border"
      >
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-1">Transaction Types</h3>
          <p className="text-sm text-muted-foreground">Distribution by method</p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={transactionData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={textColor} style={{ fontSize: '12px' }} />
            <YAxis stroke={textColor} style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#111b27' : '#f5f7fa',
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
                color: textColor,
              }}
            />
            <Bar dataKey="value" fill={primaryColor} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
