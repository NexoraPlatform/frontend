'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Eye } from 'lucide-react';

interface Transaction {
  id: string;
  recipient: string;
  amount: number;
  type: 'incoming' | 'outgoing';
  status: 'completed' | 'pending' | 'failed';
  date: string;
  time: string;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    recipient: 'Stripe Payment',
    amount: 2500,
    type: 'incoming',
    status: 'completed',
    date: 'Dec 28, 2024',
    time: '2:30 PM',
  },
  {
    id: '2',
    recipient: 'AWS Services',
    amount: 1200,
    type: 'outgoing',
    status: 'completed',
    date: 'Dec 28, 2024',
    time: '1:15 PM',
  },
  {
    id: '3',
    recipient: 'Client Invoice',
    amount: 5600,
    type: 'incoming',
    status: 'completed',
    date: 'Dec 27, 2024',
    time: '10:45 AM',
  },
  {
    id: '4',
    recipient: 'Payroll Processing',
    amount: 8300,
    type: 'outgoing',
    status: 'pending',
    date: 'Dec 27, 2024',
    time: '9:20 AM',
  },
  {
    id: '5',
    recipient: 'International Wire',
    amount: 3400,
    type: 'outgoing',
    status: 'failed',
    date: 'Dec 26, 2024',
    time: '4:10 PM',
  },
];

export function TransactionsTable() {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
      case 'pending':
        return 'bg-amber-500/20 text-amber-600 dark:text-amber-400';
      case 'failed':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="glass-effect rounded-2xl p-6 border border-border"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-lg mb-1">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">Your latest financial activity</p>
        </div>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                Recipient
              </th>
              <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                Amount
              </th>
              <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                Date & Time
              </th>
              <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {mockTransactions.map((transaction, index) => (
              <motion.tr
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors group"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {transaction.type === 'incoming' ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.recipient}</p>
                      <p className="text-xs text-muted-foreground">ID: {transaction.id}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className={`flex items-center space-x-1 ${
                    transaction.type === 'incoming' ? 'text-emerald-500' : 'text-foreground'
                  }`}>
                    {transaction.type === 'incoming' && <ArrowDownLeft className="w-4 h-4" />}
                    <span className="font-semibold">{transaction.type === 'incoming' ? '+' : '-'}${transaction.amount.toLocaleString()}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(transaction.status)}`}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-muted-foreground">
                  <div>
                    <p>{transaction.date}</p>
                    <p className="text-xs">{transaction.time}</p>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-secondary">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
