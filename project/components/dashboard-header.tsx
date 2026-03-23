'use client';

import { motion } from 'framer-motion';
import { Bell, Search, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';

export function DashboardHeader() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'New transaction', description: 'Received $5,200 from client', time: '5m ago', read: false },
    { id: 2, title: 'Security alert', description: 'New login from New York', time: '1h ago', read: false },
    { id: 3, title: 'Payment processed', description: 'Invoice #1234 has been paid', time: '3h ago', read: true },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-40 border-b border-border glass-effect"
    >
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="hidden md:flex items-center flex-1 max-w-md">
          <Search className="w-5 h-5 text-muted-foreground ml-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search transactions, users..."
            className="flex-1 ml-2 py-2 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-4 ml-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg hover:bg-secondary transition-colors group"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />

            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-96 glass-effect rounded-2xl border border-border shadow-xl overflow-hidden"
              >
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold text-sm">Notifications</h3>
                </div>
                <div className="divide-y divide-border max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 hover:bg-secondary/30 transition-colors cursor-pointer group ${
                        !notif.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          !notif.read ? 'bg-primary' : 'bg-transparent'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notif.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notif.time}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="p-3 border-t border-border text-center">
                  <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    View all
                  </button>
                </div>
              </motion.div>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg hover:bg-secondary transition-colors group"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
              JD
            </div>

            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-56 glass-effect rounded-2xl border border-border shadow-xl overflow-hidden"
              >
                <div className="p-4 border-b border-border">
                  <p className="font-medium text-sm">John Doe</p>
                  <p className="text-xs text-muted-foreground">john@company.com</p>
                </div>
                <div className="p-2 space-y-1">
                  <button className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm hover:bg-secondary transition-colors text-left">
                    <Settings className="w-4 h-4" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => (window.location.href = '/api/auth/logout')}
                    className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
