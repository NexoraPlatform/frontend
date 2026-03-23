'use client';

import { motion } from 'framer-motion';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { ChartCard } from '@/components/chart-card';

export default function AnalyticsPage() {
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
            >
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="text-muted-foreground mt-2">
                Detailed performance metrics and insights
              </p>
            </motion.div>

            <ChartCard />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="glass-effect rounded-2xl p-6 border border-border"
            >
              <h3 className="font-bold text-lg mb-4">Key Metrics</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Conversion Rate', value: '3.24%' },
                  { label: 'Avg Transaction', value: '$245.80' },
                  { label: 'Total Settled', value: '$1.2M' },
                  { label: 'Failed Rate', value: '0.12%' },
                  { label: 'Avg Settlement', value: '2.3 hours' },
                  { label: 'Peak Time', value: '2:30 PM' },
                ].map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
                    className="p-4 rounded-xl bg-secondary/30 border border-border/50"
                  >
                    <p className="text-sm text-muted-foreground mb-2">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
