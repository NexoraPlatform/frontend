'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Send, ChartBar as BarChart3, Users, Settings, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: Send, label: 'Transactions', href: '/dashboard/transactions' },
    { icon: Users, label: 'Users', href: '/dashboard/users' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-4 left-4 z-40 md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </motion.button>

      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: isOpen ? 0 : -300, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 h-screen w-72 bg-card border-r border-border glass-effect z-30 md:z-0 md:relative md:translate-x-0 md:opacity-100 flex flex-col overflow-y-auto"
      >
        <div className="p-8 border-b border-border">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <div className="text-lg font-bold">Trustora</div>
              <div className="text-xs text-muted-foreground">Dashboard</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-6 py-8 space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    active
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="ml-auto w-2 h-2 rounded-full bg-primary"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border space-y-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
          <button
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200"
            onClick={() => (window.location.href = '/api/auth/logout')}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
        />
      )}
    </>
  );
}
