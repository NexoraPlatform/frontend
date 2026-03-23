'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center px-4 py-2 rounded-full glass-effect"
            >
              <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
              <span className="text-sm font-medium">Next-gen fintech platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight"
            >
              Financial trust,{' '}
              <span className="text-gradient">automated</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-xl text-muted-foreground leading-relaxed max-w-2xl"
            >
              Secure your transactions and automate compliance with Trustora's
              next-gen fintech engine.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-medium text-base px-8 py-6 rounded-xl transition-all duration-200 active:scale-[0.98] group"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 font-medium text-base px-8 py-6 rounded-xl transition-all duration-200 active:scale-[0.98] group"
              >
                <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center space-x-8 pt-8"
            >
              <div>
                <div className="text-3xl font-bold text-gradient">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime SLA</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <div className="text-3xl font-bold text-gradient">$2B+</div>
                <div className="text-sm text-muted-foreground">Secured</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <div className="text-3xl font-bold text-gradient">500K+</div>
                <div className="text-sm text-muted-foreground">Transactions</div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative glass-effect rounded-3xl p-8 shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Balance</div>
                    <div className="text-3xl font-bold">$2,847,392.00</div>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium">
                    +12.5%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Income', value: '$842.5K', trend: '+8.2%' },
                    { label: 'Expenses', value: '$234.1K', trend: '-2.4%' },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                      className="p-4 rounded-2xl bg-background/50 border border-white/5"
                    >
                      <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                      <div className="text-xl font-bold">{item.value}</div>
                      <div className="text-xs text-primary mt-1">{item.trend}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'Transaction A', amount: '+$12,400', time: '2m ago' },
                    { name: 'Transaction B', amount: '+$8,200', time: '5m ago' },
                    { name: 'Transaction C', amount: '+$5,600', time: '12m ago' },
                  ].map((transaction, index) => (
                    <motion.div
                      key={transaction.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-white/5 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{transaction.name}</div>
                          <div className="text-xs text-muted-foreground">{transaction.time}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-primary">{transaction.amount}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(27, 196, 125, 0)',
                    '0 0 0 20px rgba(27, 196, 125, 0.05)',
                    '0 0 0 0 rgba(27, 196, 125, 0)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -z-10 inset-0 rounded-3xl"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
