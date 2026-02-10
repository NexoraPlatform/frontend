'use client';

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, MessageSquareReply, SendHorizontal, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PriceDisplay } from '@/components/PriceDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { FetchError, fetchClient } from '@/lib/fetch-client';
import { cn } from '@/lib/utils';
import type {
  AiAssistantMessage,
  AiBriefBuilderResponse,
  AiBriefFormDraft,
  AiBriefQuestion,
  AiTeamStructureItem,
} from '@/types/ai';

type ChatRole = 'assistant' | 'user';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type BriefCopilotProps = {
  locale: string;
  className?: string;
  onApply: (draft: AiBriefFormDraft) => void;
};

const DEFAULT_SYSTEM_PROMPT = [
  'You are an AI marketplace architect.',
  'Help clients clarify their project brief through iterative questions.',
  'When more details are needed return status=CLARIFY with concise questions.',
  'When enough details exist return status=FINAL and include structured brief data.',
].join(' ');

const toObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const toString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return '';
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
};

const normalizeBudgetType = (value: unknown): 'FIXED' | 'HOURLY' => {
  const normalized = toString(value).toUpperCase();
  return normalized === 'HOURLY' ? 'HOURLY' : 'FIXED';
};

const extractAssistantText = (response: AiBriefBuilderResponse): string => {
  const objectResponse = toObject(response);
  const candidates = [
    response.message,
    objectResponse?.reply,
    objectResponse?.content,
    objectResponse?.summary,
    objectResponse?.text,
  ];

  for (const candidate of candidates) {
    const normalized = toString(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return '';
};

const normalizeQuestions = (questions: AiBriefQuestion[] | string[] | undefined): string[] => {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry.trim();
      }
      return toString(entry?.question);
    })
    .filter(Boolean);
};

const normalizeQuickReplies = (response: AiBriefBuilderResponse): string[] => {
  const directReplies = Array.isArray(response.quick_replies)
    ? response.quick_replies
    : [];
  const questionReplies = Array.isArray(response.questions)
    ? response.questions.flatMap((entry) =>
        typeof entry === 'object' && entry && Array.isArray(entry.quick_replies)
          ? entry.quick_replies
          : []
      )
    : [];

  return Array.from(
    new Set(
      [...directReplies, ...questionReplies]
        .map((entry) => toString(entry))
        .filter(Boolean)
        .slice(0, 8)
    )
  );
};

const normalizeTeamStructure = (
  response: AiBriefBuilderResponse,
  briefPayload: Record<string, unknown> | null
): AiTeamStructureItem[] => {
  const directTeam = Array.isArray(response.team_structure) ? response.team_structure : [];
  const briefTeam =
    briefPayload && Array.isArray(briefPayload.team_structure)
      ? briefPayload.team_structure
      : [];
  const rawItems = (directTeam.length > 0 ? directTeam : briefTeam) as unknown[];

  return rawItems
    .map((entry) => {
      const teamItem = toObject(entry);
      if (!teamItem) {
        return null;
      }

      const role = toString(teamItem.role);
      if (!role) {
        return null;
      }

      const normalizedItem: AiTeamStructureItem = { role };
      const service = toString(teamItem.service);
      const level = toString(teamItem.level);
      const count = toNumber(teamItem.count);
      const estimatedCost = toNumber(teamItem.estimated_cost);

      if (service) {
        normalizedItem.service = service;
      }
      if (level) {
        normalizedItem.level = level;
      }
      if (count !== null) {
        normalizedItem.count = count;
      }
      if (estimatedCost !== null) {
        normalizedItem.estimated_cost = estimatedCost;
      }

      return normalizedItem;
    })
    .filter((entry): entry is AiTeamStructureItem => entry !== null);
};

const buildFormDraft = (response: AiBriefBuilderResponse): AiBriefFormDraft | null => {
  const briefPayload =
    toObject(response.brief) ?? toObject(response.result) ?? toObject(response.data) ?? null;
  const briefData = briefPayload ?? {};
  const fallbackBudget = toNumber((response as { estimated_budget?: unknown }).estimated_budget);

  const title = toString(briefData.title);
  const description = toString(briefData.description);
  const technologies = Array.isArray(briefData.technologies)
    ? briefData.technologies.map((item) => toString(item)).filter(Boolean)
    : [];

  const budgetObject = toObject(briefData.budget);
  const budgetAmount =
    toNumber(briefData.estimated_budget) ??
    toNumber(briefData.budget) ??
    toNumber(budgetObject?.amount) ??
    fallbackBudget;

  const budgetType = normalizeBudgetType(briefData.budget_type ?? budgetObject?.type);
  const team_structure = normalizeTeamStructure(response, briefPayload);

  const hasMaterialData =
    Boolean(title) ||
    Boolean(description) ||
    Boolean(technologies.length) ||
    budgetAmount !== null ||
    team_structure.length > 0;

  if (!hasMaterialData) {
    return null;
  }

  return {
    title,
    description,
    budget: budgetAmount !== null ? String(budgetAmount) : '',
    budgetType,
    technologies: Array.from(new Set(technologies)),
    team_structure,
  };
};

function TechnicalDraftSkeleton() {
  return (
    <Card className="border-dashed border-slate-300/90 bg-white/90 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-20" />
          <motion.div
            className="h-3 w-[2px] bg-emerald-500"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-10/12" />
        <Skeleton className="h-3 w-9/12" />
        <Skeleton className="h-3 w-7/12" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BriefCopilot({ locale, className, onApply }: BriefCopilotProps) {
  const t = useTranslations();

  const welcomeMessage = t('client.project_requests.brief_copilot.welcome');
  const [conversation, setConversation] = useState<AiAssistantMessage[]>([
    { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
    { role: 'assistant', content: welcomeMessage },
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'intro', role: 'assistant', content: welcomeMessage },
  ]);
  const [input, setInput] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [finalDraft, setFinalDraft] = useState<AiBriefFormDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (rawContent: string) => {
      const normalizedContent = rawContent.trim();
      if (!normalizedContent || isLoading) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setInput('');

      const nextUserMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: normalizedContent,
      };
      const nextConversation: AiAssistantMessage[] = [
        ...conversation,
        { role: 'user', content: normalizedContent },
      ];

      setMessages((prev) => [...prev, nextUserMessage]);
      setConversation(nextConversation);
      setQuestions([]);
      setQuickReplies([]);

      try {
        const response = await fetchClient.buildBrief(nextConversation, locale);
        const status = toString(response.status).toUpperCase();
        const assistantText =
          extractAssistantText(response) ||
          (status === 'FINAL'
            ? t('client.project_requests.brief_copilot.final_ready')
            : t('client.project_requests.brief_copilot.clarify_ready'));

        if (assistantText) {
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: assistantText,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setConversation((prev) => [...prev, { role: 'assistant', content: assistantText }]);
        }

        if (status === 'CLARIFY') {
          setFinalDraft(null);
          setQuestions(normalizeQuestions(response.questions));
          setQuickReplies(normalizeQuickReplies(response));
          return;
        }

        if (status === 'FINAL') {
          setQuestions([]);
          setQuickReplies([]);
          setFinalDraft(buildFormDraft(response));
        }
      } catch (cause) {
        if (cause instanceof FetchError) {
          setError(cause.message);
        } else if (cause instanceof Error) {
          setError(cause.message);
        } else {
          setError(t('client.project_requests.brief_copilot.errors.generic'));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [conversation, isLoading, locale, t]
  );

  const submitDisabled = useMemo(() => isLoading || input.trim().length === 0, [input, isLoading]);
  const teamPreview = finalDraft?.team_structure ?? [];

  return (
    <Card className={cn('border-transparent shadow-sm', className)}>
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-[#0B1C2D] dark:text-[#E6EDF3]">
          <Sparkles className="h-5 w-5 text-emerald-500" />
          {t('client.project_requests.brief_copilot.title')}
        </CardTitle>
        <CardDescription>{t('client.project_requests.brief_copilot.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/60">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn(
                  'max-w-[92%] rounded-lg px-3 py-2 text-sm',
                  message.role === 'assistant'
                    ? 'border border-slate-200 bg-white text-slate-700 dark:border-[#1E2A3D] dark:bg-[#0F1827] dark:text-[#C9D4E7]'
                    : 'ml-auto bg-emerald-600 text-white'
                )}
              >
                {message.role === 'assistant' ? (
                  <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                    <Bot className="h-3.5 w-3.5" />
                    {t('client.project_requests.brief_copilot.assistant_name')}
                  </span>
                ) : null}
                <p className="whitespace-pre-wrap">{message.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading ? <TechnicalDraftSkeleton /> : null}
        </div>

        {questions.length > 0 ? (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-[#1E2A3D] dark:bg-[#0F1827]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
              <MessageSquareReply className="h-4 w-4 text-emerald-500" />
              {t('client.project_requests.brief_copilot.questions_title')}
            </div>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-[#A3ADC2]">
              {questions.map((question) => (
                <li key={question}>• {question}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {quickReplies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <Button
                key={reply}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => void sendMessage(reply)}
                disabled={isLoading}
              >
                {reply}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={4}
            placeholder={t('client.project_requests.brief_copilot.input_placeholder')}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => void sendMessage(input)}
              disabled={submitDisabled}
              className="inline-flex items-center gap-2"
            >
              <SendHorizontal className="h-4 w-4" />
              {t('client.project_requests.brief_copilot.send')}
            </Button>
          </div>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {finalDraft ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10"
          >
            <div>
              <h4 className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {t('client.project_requests.brief_copilot.summary_title')}
              </h4>
              <p className="mt-1 text-sm text-slate-600 dark:text-[#A3ADC2]">
                {finalDraft.title || t('client.project_requests.brief_copilot.summary_title_empty')}
              </p>
              {finalDraft.description ? (
                <p className="mt-2 whitespace-pre-wrap text-xs text-slate-500 dark:text-[#8FA0B8]">
                  {finalDraft.description}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-200/80 bg-white/90 p-3 dark:border-emerald-500/20 dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.summary_budget')}
                </div>
                <div className="mt-1 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {finalDraft.budget ? <PriceDisplay value={Number(finalDraft.budget)} /> : '—'}
                  <span className="ml-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                    ({finalDraft.budgetType})
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-emerald-200/80 bg-white/90 p-3 dark:border-emerald-500/20 dark:bg-[#0F1827]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.summary_technologies')}
                </div>
                <div className="mt-1 text-sm text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {finalDraft.technologies.length > 0
                    ? finalDraft.technologies.join(', ')
                    : t('client.project_requests.brief_copilot.summary_technologies_empty')}
                </div>
              </div>
            </div>

            {teamPreview.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                  {t('client.project_requests.brief_copilot.team_title')}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {teamPreview.map((item, index) => (
                    <div
                      key={`${item.role}-${index}`}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-[#1E2A3D] dark:bg-[#0F1827]"
                    >
                      <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {item.role}
                        {item.count ? ` × ${item.count}` : ''}
                      </div>
                      {item.level ? (
                        <div className="text-slate-500 dark:text-[#8FA0B8]">
                          {t('client.project_requests.brief_copilot.team_level', { level: item.level })}
                        </div>
                      ) : null}
                      {item.estimated_cost !== undefined ? (
                        <div className="mt-1 text-emerald-700 dark:text-emerald-300">
                          <PriceDisplay value={item.estimated_cost} />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <Button type="button" onClick={() => onApply(finalDraft)} className="w-full">
              {t('client.project_requests.brief_copilot.apply_to_form')}
            </Button>
          </motion.div>
        ) : null}
      </CardContent>
    </Card>
  );
}
