'use client';

import { motion } from 'framer-motion';
import { UserPlus, Settings, Rocket, ArrowRight } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: UserPlus,
      title: 'Sign Up',
      description:
        'Create your account in minutes. No credit card required for trial.',
    },
    {
      number: '02',
      icon: Settings,
      title: 'Configure',
      description:
        'Set up your preferences, integrate APIs, and customize workflows.',
    },
    {
      number: '03',
      icon: Rocket,
      title: 'Scale',
      description:
        'Go live and process transactions at scale with zero downtime.',
    },
  ];

  return (
    <section id="how-it-works" className="py-32 bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-effect mb-6">
            <span className="text-sm font-medium">How it Works</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Get started in{' '}
            <span className="text-gradient">3 simple steps</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            From signup to first transaction in under 10 minutes
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2" />

          <div className="grid md:grid-cols-3 gap-8 lg:gap-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 rounded-3xl glass-effect flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-10 h-10 text-primary" />
                      </div>
                      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                          {step.number}
                        </span>
                      </div>
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl -z-10"
                      />
                    </div>

                    <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed max-w-sm">
                      {step.description}
                    </p>

                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-12 -right-8 xl:-right-12">
                        <ArrowRight className="w-8 h-8 text-primary/40" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-sm text-muted-foreground">
            Join 500+ companies already using Trustora
          </p>
        </motion.div>
      </div>
    </section>
  );
}
