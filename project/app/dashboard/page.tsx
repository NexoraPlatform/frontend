'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, ArrowUpRight, MoveVertical as MoreVertical } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { KPICards } from '@/components/kpi-cards';
import { ChartCard } from '@/components/chart-card';
import { TransactionsTable } from '@/components/transactions-table';

export default function DashboardPage() {
  const kpiCards = [
    {
      title: 'Total Revenue',
      value: '$2.8M',
      change: 12.5,
      icon: <DollarSign className="w-6 h-6 text-white" />,
      trend: 'up' as const,
      color: 'bg-gradient-to-br from-primary to-emerald-400',
    },
    {
      title: 'Transactions',
      value: '12.4K',
      change: 8.2,
      icon: <ArrowUpRight className="w-6 h-6 text-white" />,
      trend: 'up' as const,
      color: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    },
    {
      title: 'Active Users',
      value: '5.2K',
      change: 3.1,
      icon: <Users className="w-6 h-6 text-white" />,
      trend: 'up' as const,
      color: 'bg-gradient-to-br from-purple-500 to-pink-400',
    },
    {
      title: 'Growth Rate',
      value: '24.5%',
      change: 5.4,
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      trend: 'up' as const,
      color: 'bg-gradient-to-br from-orange-500 to-red-400',
    },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8 max-w-7xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Welcome back, John. Here's your financial overview.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </motion.div>

            <KPICards cards={kpiCards} />

            <ChartCard />

            <TransactionsTable />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="glass-effect rounded-2xl p-6 border border-border"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg mb-1">Quick Actions</h3>
                  <p className="text-sm text-muted-foreground">
                    Common operations at your fingertips
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'New Transaction', icon: '↗️' },
                  { label: 'Request Payment', icon: '💰' },
                  { label: 'Generate Report', icon: '📊' },
                  { label: 'Export Data', icon: '📥' },
                ].map((action, index) => (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.05, duration: 0.4 }}
                    className="p-4 rounded-xl border border-border glass-effect hover:border-primary/40 transition-all duration-200 active:scale-95"
                  >
                    <div className="text-2xl mb-2">{action.icon}</div>
                    <p className="text-sm font-medium">{action.label}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
