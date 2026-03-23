'use client';

import { motion } from 'framer-motion';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { TransactionsTable } from '@/components/transactions-table';
import { Filter, Download } from 'lucide-react';

export default function TransactionsPage() {
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
                <h1 className="text-3xl font-bold">Transactions</h1>
                <p className="text-muted-foreground mt-2">
                  View and manage all your transactions
                </p>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Filter className="w-5 h-5" />
                  <span>Filter</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Export</span>
                </motion.button>
              </div>
            </motion.div>

            <TransactionsTable />
          </div>
        </main>
      </div>
    </div>
  );
}
