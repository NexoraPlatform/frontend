'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileCheck, CircleCheck as CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TrustSecurity() {
  const securityFeatures = [
    {
      icon: Shield,
      title: 'SOC 2 Type II Certified',
      description: 'Independently audited for security and compliance',
    },
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'AES-256 encryption for all data in transit and at rest',
    },
    {
      icon: Eye,
      title: 'Real-Time Monitoring',
      description: '24/7 threat detection and instant response systems',
    },
    {
      icon: FileCheck,
      title: 'Full Audit Trails',
      description: 'Complete transaction history for compliance and reporting',
    },
  ];

  const certifications = [
    'PCI DSS Level 1',
    'ISO 27001',
    'GDPR Compliant',
    'SOC 2 Type II',
    'FINRA Approved',
    'Bank-Grade Security',
  ];

  return (
    <section id="security" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
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
            <Shield className="w-4 h-4 mr-2 text-primary" />
            <span className="text-sm font-medium">Trust & Security</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Your security is{' '}
            <span className="text-gradient">our priority</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Enterprise-grade security infrastructure trusted by financial institutions
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div className="space-y-6">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-start space-x-4 p-6 rounded-2xl glass-effect hover:border-primary/40 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="glass-effect rounded-3xl p-8 lg:p-12">
              <div className="space-y-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-6">
                    <Shield className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    Bank-Grade Protection
                  </h3>
                  <p className="text-muted-foreground">
                    Multi-layered security architecture protecting over $2B in transactions
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    'Zero-knowledge architecture',
                    'Hardware security modules',
                    'Biometric authentication',
                    'Automated threat response',
                    'Daily security audits',
                    'Incident response team',
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.05 }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-effect rounded-3xl p-8 lg:p-12"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-3">Certified & Compliant</h3>
            <p className="text-muted-foreground">
              Meeting the highest industry standards for security and compliance
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="p-4 rounded-xl bg-background/50 border border-white/5 text-center hover:border-primary/40 transition-colors duration-300"
              >
                <div className="text-sm font-medium">{cert}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            variant="outline"
            className="border-2 font-medium px-8"
          >
            View Security Documentation
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
