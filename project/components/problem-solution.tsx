'use client';

import { motion } from 'framer-motion';
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle2, TrendingUp } from 'lucide-react';

export function ProblemSolution() {
  const problems = [
    {
      icon: AlertCircle,
      title: 'Manual Compliance',
      description: 'Hours wasted on regulatory paperwork and compliance checks.',
    },
    {
      icon: AlertCircle,
      title: 'Security Risks',
      description: 'Vulnerable transaction systems exposing financial data.',
    },
    {
      icon: AlertCircle,
      title: 'Slow Processing',
      description: 'Delayed transactions affecting business operations.',
    },
  ];

  const solutions = [
    {
      icon: CheckCircle2,
      title: 'Automated Compliance',
      description: 'AI-powered compliance automation reducing manual work by 95%.',
      color: 'text-primary',
    },
    {
      icon: CheckCircle2,
      title: 'Bank-Grade Security',
      description: 'End-to-end encryption with multi-layer security protocols.',
      color: 'text-primary',
    },
    {
      icon: CheckCircle2,
      title: 'Instant Settlement',
      description: 'Real-time transaction processing with sub-second confirmations.',
      color: 'text-primary',
    },
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-24">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6 mb-12"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full glass-effect">
                <span className="text-sm font-medium text-destructive">The Problem</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
                Traditional fintech is{' '}
                <span className="text-destructive">broken</span>
              </h2>
            </motion.div>

            <div className="space-y-6">
              {problems.map((problem, index) => {
                const Icon = problem.icon;
                return (
                  <motion.div
                    key={problem.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5 hover:border-destructive/40 transition-colors duration-300"
                  >
                    <Icon className="w-8 h-8 text-destructive mb-4" />
                    <h3 className="text-xl font-bold mb-2">{problem.title}</h3>
                    <p className="text-muted-foreground">{problem.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6 mb-12"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full glass-effect">
                <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                <span className="text-sm font-medium text-primary">Our Solution</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
                Meet the <span className="text-gradient">future</span> of fintech
              </h2>
            </motion.div>

            <div className="space-y-6">
              {solutions.map((solution, index) => {
                const Icon = solution.icon;
                return (
                  <motion.div
                    key={solution.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="p-6 rounded-2xl border border-primary/20 glass-effect hover:border-primary/40 transition-colors duration-300"
                  >
                    <Icon className={`w-8 h-8 ${solution.color} mb-4`} />
                    <h3 className="text-xl font-bold mb-2">{solution.title}</h3>
                    <p className="text-muted-foreground">{solution.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
