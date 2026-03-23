'use client';

import { motion } from 'framer-motion';
import { Building2, Landmark, Briefcase, TrendingUp, Shield, Wallet } from 'lucide-react';

export function SocialProof() {
  const partners = [
    { name: 'SecureBank', icon: Landmark },
    { name: 'FinanceHub', icon: Building2 },
    { name: 'TradePro', icon: Briefcase },
    { name: 'WealthMax', icon: TrendingUp },
    { name: 'SafeGuard', icon: Shield },
    { name: 'PayStream', icon: Wallet },
  ];

  return (
    <section className="py-24 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Trusted by leading financial institutions
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {partners.map((partner, index) => {
            const Icon = partner.icon;
            return (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col items-center justify-center space-y-3 p-6 rounded-2xl hover:glass-effect transition-all duration-300 group"
              >
                <Icon className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {partner.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
