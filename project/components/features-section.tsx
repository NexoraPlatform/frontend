'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, ChartBar as BarChart3, Lock, Globe, FileCheck, Sparkles, Gauge } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: 'Military-Grade Security',
      description:
        'Advanced encryption and multi-factor authentication protect every transaction with enterprise-level security.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description:
        'Process thousands of transactions per second with our optimized infrastructure and smart routing.',
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description:
        'Comprehensive dashboards and insights help you make data-driven decisions instantly.',
    },
    {
      icon: FileCheck,
      title: 'Auto Compliance',
      description:
        'Stay compliant automatically with built-in regulatory frameworks and audit trails.',
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description:
        'Support for 120+ currencies and payment methods across 180+ countries worldwide.',
    },
    {
      icon: Lock,
      title: 'Smart Contracts',
      description:
        'Automated, trustless agreements executed on blockchain with complete transparency.',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Insights',
      description:
        'Machine learning algorithms detect anomalies and optimize your financial operations.',
    },
    {
      icon: Gauge,
      title: 'Performance Monitoring',
      description:
        '24/7 system monitoring with 99.9% uptime SLA and instant issue resolution.',
    },
  ];

  return (
    <section id="features" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-effect mb-6">
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            <span className="text-sm font-medium">Features</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Everything you need to{' '}
            <span className="text-gradient">scale</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Enterprise-grade fintech infrastructure built for modern businesses
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="group p-8 rounded-3xl glass-effect hover:border-primary/40 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
