"use client";

import { motion } from "framer-motion";
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle2, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

import type { LandingIconItem } from "./types";

export function TrustoraLandingProblemSolutionSection() {
  const t = useTranslations("trustora.landing");

  const problems: LandingIconItem[] = [
    {
      icon: AlertCircle,
      title: t("problem_solution.problems.first.title"),
      description: t("problem_solution.problems.first.description"),
    },
    {
      icon: AlertCircle,
      title: t("problem_solution.problems.second.title"),
      description: t("problem_solution.problems.second.description"),
    },
    {
      icon: AlertCircle,
      title: t("problem_solution.problems.third.title"),
      description: t("problem_solution.problems.third.description"),
    },
  ];

  const solutions: LandingIconItem[] = [
    {
      icon: CheckCircle2,
      title: t("problem_solution.solutions.first.title"),
      description: t("problem_solution.solutions.first.description"),
    },
    {
      icon: CheckCircle2,
      title: t("problem_solution.solutions.second.title"),
      description: t("problem_solution.solutions.second.description"),
    },
    {
      icon: CheckCircle2,
      title: t("problem_solution.solutions.third.title"),
      description: t("problem_solution.solutions.third.description"),
    },
  ];

  return (
    <section className="relative isolate overflow-hidden py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-24 lg:grid-cols-2">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12 space-y-6"
            >
              <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                <span className="text-sm font-medium text-destructive">
                  {t("problem_solution.problem_badge")}
                </span>
              </div>
              <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
                {t("problem_solution.problem_title")}{" "}
                <span className="text-destructive">{t("problem_solution.problem_title_highlight")}</span>
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
                    className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 transition-colors duration-300 hover:border-destructive/40"
                  >
                    <Icon className="mb-4 h-8 w-8 text-destructive" />
                    <h3 className="mb-2 text-xl font-bold">{problem.title}</h3>
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
              className="mb-12 space-y-6"
            >
              <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {t("problem_solution.solution_badge")}
                </span>
              </div>
              <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
                {t("problem_solution.solution_title")}{" "}
                <span className="text-gradient">{t("problem_solution.solution_title_highlight")}</span>{" "}
                {t("problem_solution.solution_title_end")}
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
                    className="glass-effect rounded-2xl border border-primary/20 p-6 transition-colors duration-300 hover:border-primary/40"
                  >
                    <Icon className="mb-4 h-8 w-8 text-primary" />
                    <h3 className="mb-2 text-xl font-bold">{solution.title}</h3>
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
