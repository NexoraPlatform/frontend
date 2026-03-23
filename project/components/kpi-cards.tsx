'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface KPICard {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
  color: string;
}

interface KPICardsProps {
  cards: KPICard[];
}

export function KPICards({ cards }: KPICardsProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.6 }}
          className="glass-effect rounded-2xl p-6 border border-border hover:border-primary/40 transition-all duration-300 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
              card.trend === 'up'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-destructive/20 text-destructive'
            }`}>
              {card.trend === 'up' ? (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+{card.change}%</span>
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>-{card.change}%</span>
                </>
              )}
            </div>
          </div>

          <h3 className="text-sm text-muted-foreground mb-2 font-medium">
            {card.title}
          </h3>
          <p className="text-3xl font-bold mb-4">{card.value}</p>

          <div className="text-xs text-muted-foreground">
            {card.trend === 'up' ? 'Compared to last month' : 'Decline from last month'}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
