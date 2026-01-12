'use client';

import { Star, MapPin, Zap } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ProjectWithClient, formatCurrency, formatDeadline, formatDate } from '@/lib/projects';
import { Locale } from '@/types/locale';

interface ProjectCardProps {
  project: ProjectWithClient;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const pathname = usePathname();
  const locale = (pathname?.split('/')?.[1] as Locale) || 'ro';

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-[#1E2A3D] ${
        project.is_recommended
          ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/50 border-emerald-200 shadow-md dark:from-[#0F2E25] dark:to-[#0F2E25]/60'
          : 'glass-card border-slate-200'
      }`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-midnight-blue dark:text-[#E6EDF3]">
                {project.title}
              </h3>
              {project.is_recommended && (
                <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 rounded-full dark:bg-[#153B2D]">
                  <Zap size={14} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-[#7BF1B8]">
                    Recomandat
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full dark:bg-[#111B2D] dark:text-[#A3ADC2]">
                {project.category}
              </span>
            </div>
          </div>

          {project.client && (
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-2">
                {project.client.avatar_url && (
                  <Image
                    src={project.client.avatar_url}
                    alt={project.client.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
              </div>
              <p className="text-sm font-bold text-midnight-blue dark:text-[#E6EDF3]">
                {project.client.name}
              </p>
              <p className="text-xs text-slate-500 flex items-center justify-end gap-1 dark:text-[#7C8799]">
                <MapPin size={12} />
                {project.client.location}
              </p>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed line-clamp-2 dark:text-[#A3ADC2]">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {project.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium dark:bg-[#111B2D] dark:text-[#A3ADC2]"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span className="text-xs text-slate-500 px-2.5 py-1 dark:text-[#7C8799]">
              +{project.technologies.length - 4} mai multe
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-[#1E2A3D]">
          <div>
            <p className="text-xs text-slate-500 mb-1 dark:text-[#7C8799]">Buget</p>
            <p className="text-sm font-bold text-midnight-blue dark:text-[#E6EDF3]">
              {formatCurrency(project.budget)}
            </p>
            <p className="text-xs text-slate-500 dark:text-[#7C8799]">
              {project.budget_type === 'fixed' ? 'Proiect fix' : 'Pe oră'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1 dark:text-[#7C8799]">Deadline</p>
            <p className="text-sm font-bold text-midnight-blue dark:text-[#E6EDF3]">
              {formatDeadline(project.deadline, locale)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1 dark:text-[#7C8799]">Oferte primite</p>
            <p className="text-sm font-bold text-midnight-blue dark:text-[#E6EDF3]">
              {project.offers_count}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1 dark:text-[#7C8799]">Postat</p>
            <p className="text-sm font-bold text-midnight-blue dark:text-[#E6EDF3]">
              {formatDate(project.created_at)}
            </p>
          </div>
        </div>

        {project.client && (
          <div className="flex items-end gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => {
                  const fillPercent = Math.min(Math.max(project.client!.rating - i, 0), 1) * 100;
                  return (
                    <span key={i} className="relative w-[14px] h-[14px]">
                      <Star size={14} className="text-warning-amber" fill="none" />
                      <span
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${fillPercent}%` }}
                      >
                        <Star
                          size={14}
                          className="text-warning-amber drop-shadow-[0_0_4px_rgba(245,166,35,0.45)]"
                          fill="#F5A623" stroke="#F5A623"
                        />
                      </span>
                    </span>
                  );
                })}
              </div>
              <span className="text-sm font-bold text-midnight-blue dark:text-[#E6EDF3]">
                {project.client.rating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 dark:text-[#7C8799]">
                ({project.client.total_reviews})
              </span>
            </div>
            <button className="ml-auto btn-primary px-4 py-2 font-bold rounded-lg">
              Detalii
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
