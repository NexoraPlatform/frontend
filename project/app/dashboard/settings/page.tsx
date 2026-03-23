'use client';

import { motion } from 'framer-motion';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { Lock, Bell, Shield, Eye } from 'lucide-react';

export default function SettingsPage() {
  const settingsSections = [
    {
      title: 'Account Settings',
      icon: Lock,
      description: 'Manage your account information and password',
      items: [
        { label: 'Email Address', value: 'john@company.com', editable: true },
        { label: 'Phone Number', value: '+1 (555) 123-4567', editable: true },
        { label: 'Password', value: '••••••••', editable: true },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'Control how you receive alerts and updates',
      items: [
        { label: 'Email Notifications', value: 'Enabled', toggle: true },
        { label: 'Transaction Alerts', value: 'Enabled', toggle: true },
        { label: 'Security Alerts', value: 'Enabled', toggle: true },
      ],
    },
    {
      title: 'Security',
      icon: Shield,
      description: 'Enhance your account security',
      items: [
        { label: 'Two-Factor Authentication', value: 'Enabled', toggle: true },
        { label: 'Login Alerts', value: 'Enabled', toggle: true },
        { label: 'API Keys', value: '2 Active', editable: true },
      ],
    },
    {
      title: 'Privacy',
      icon: Eye,
      description: 'Control your data and privacy settings',
      items: [
        { label: 'Data Sharing', value: 'Limited', editable: true },
        { label: 'Analytics Tracking', value: 'Disabled', toggle: true },
        { label: 'Profile Visibility', value: 'Private', editable: true },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8 max-w-4xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your account preferences and security
              </p>
            </motion.div>

            {settingsSections.map((section, sectionIndex) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + sectionIndex * 0.1, duration: 0.6 }}
                  className="glass-effect rounded-2xl p-6 border border-border"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">{section.title}</h2>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {section.items.map((item, itemIndex) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + sectionIndex * 0.1 + itemIndex * 0.05, duration: 0.4 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/20 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.value}</p>
                        </div>
                        {item.toggle ? (
                          <div className="w-12 h-6 rounded-full bg-primary/30 relative cursor-pointer">
                            <div className="w-5 h-5 rounded-full bg-primary absolute right-0.5 top-0.5 transition-all" />
                          </div>
                        ) : item.editable ? (
                          <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                            Edit
                          </button>
                        ) : null}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-between items-center p-6 glass-effect rounded-2xl border border-border"
            >
              <div>
                <h3 className="font-bold text-sm mb-1">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <button className="px-6 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm">
                Delete
              </button>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
