'use client';

import { motion } from 'framer-motion';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { Plus, Search } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@company.com', status: 'active', joinDate: 'Jan 15, 2024' },
  { id: '2', name: 'Jane Smith', email: 'jane@company.com', status: 'active', joinDate: 'Feb 20, 2024' },
  { id: '3', name: 'Alex Johnson', email: 'alex@company.com', status: 'active', joinDate: 'Mar 10, 2024' },
  { id: '4', name: 'Sarah Williams', email: 'sarah@company.com', status: 'inactive', joinDate: 'Apr 5, 2024' },
  { id: '5', name: 'Mike Brown', email: 'mike@company.com', status: 'active', joinDate: 'May 1, 2024' },
];

export default function UsersPage() {
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
                <h1 className="text-3xl font-bold">Users</h1>
                <p className="text-muted-foreground mt-2">
                  Manage your team members and permissions
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add User</span>
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="glass-effect rounded-2xl p-6 border border-border"
            >
              <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-12 pr-4 py-2 rounded-lg border border-border glass-effect placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                        Join Date
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <p className="text-sm font-medium">{user.name}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {user.joinDate}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                            Edit
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
