export type AdminTestLevel = "JUNIOR" | "MEDIU" | "SENIOR" | "EXPERT";
export type AdminTestStatus = "ACTIVE" | "INACTIVE" | "DRAFT";
export type AdminTestQuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "CODE_WRITING"
  | "TEXT_INPUT";

export type AdminTestCase = {
  input: string;
  expectedOutput: string;
  description?: string;
};

export type AdminTestQuestion = {
  id: string;
  type: AdminTestQuestionType;
  question: string;
  points: number;
  options: string[];
  correctAnswers: string[];
  explanation?: string;
  codeTemplate?: string;
  codeSolution?: string;
  expectedOutput?: string;
  testCases: AdminTestCase[];
  meta?: string;
};

export type AdminTestEditorValues = {
  title: string;
  description: string;
  serviceId: string;
  level: AdminTestLevel;
  timeLimit: number;
  passingScore: number;
  status: AdminTestStatus;
  questions: AdminTestQuestion[];
};

export const createEmptyAdminTestQuestion = (): AdminTestQuestion => ({
  id: "",
  type: "SINGLE_CHOICE",
  question: "",
  points: 10,
  options: ["", "", "", ""],
  correctAnswers: [],
  explanation: "",
  codeTemplate: "",
  codeSolution: "",
  expectedOutput: "",
  testCases: [],
  meta: "",
});

export const createDefaultAdminTestValues = (): AdminTestEditorValues => ({
  title: "",
  description: "",
  serviceId: "",
  level: "JUNIOR",
  timeLimit: 60,
  passingScore: 70,
  status: "DRAFT",
  questions: [],
});

export function parseAdminTestStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map(String);
  }

  if (input == null) {
    return [];
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {
      return input
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export function tryParseAdminTestJson<T>(input: unknown, fallback: T): T {
  if (typeof input !== "string") {
    return fallback;
  }

  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

export function normalizeAdminTestQuestionType(type: unknown): AdminTestQuestionType {
  const normalized = String(type ?? "").toUpperCase();

  if (normalized === "CODE") {
    return "CODE_WRITING";
  }

  if (normalized === "TRUE_FALSE") {
    return "TEXT_INPUT";
  }

  if (
    normalized === "SINGLE_CHOICE" ||
    normalized === "MULTIPLE_CHOICE" ||
    normalized === "CODE_WRITING" ||
    normalized === "TEXT_INPUT"
  ) {
    return normalized;
  }

  return "SINGLE_CHOICE";
}

export function normalizeAdminTestQuestion(raw: any): AdminTestQuestion {
  const meta = tryParseAdminTestJson<Record<string, unknown>>(raw?.meta, {});
  const options = parseAdminTestStringArray(raw?.options);
  const correctAnswers = parseAdminTestStringArray(raw?.correctAnswers ?? raw?.correct_answers);

  return {
    id: String(raw?.id ?? `q-${Date.now()}`),
    type: normalizeAdminTestQuestionType(raw?.type),
    question: String(raw?.question ?? ""),
    points: Number(raw?.points ?? 0),
    options,
    correctAnswers,
    explanation: String(raw?.explanation ?? meta.explanation ?? ""),
    codeTemplate: String(raw?.codeTemplate ?? meta.codeTemplate ?? ""),
    codeSolution: String(raw?.codeSolution ?? meta.codeSolution ?? ""),
    expectedOutput: String(raw?.expectedOutput ?? meta.expectedOutput ?? ""),
    testCases: Array.isArray(raw?.testCases)
      ? raw.testCases
      : Array.isArray(meta.testCases)
        ? (meta.testCases as AdminTestCase[])
        : [],
    meta: typeof raw?.meta === "string" ? raw.meta : "",
  };
}

export function serializeAdminTestQuestionForApi(
  question: AdminTestQuestion,
  order: number
) {
  const options = question.options.filter(Boolean);
  const correctAnswers = question.correctAnswers.filter(Boolean);

  return {
    type:
      question.type === "CODE_WRITING"
        ? "CODE"
        : question.type === "TEXT_INPUT"
          ? "TRUE_FALSE"
          : question.type,
    question: question.question,
    options:
      question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE"
        ? options
        : null,
    correct_answers: correctAnswers,
    points: question.points,
    order,
    meta: JSON.stringify({
      explanation: question.explanation || "",
      codeTemplate: question.codeTemplate || "",
      codeSolution: question.codeSolution || "",
      expectedOutput: question.expectedOutput || "",
      testCases: question.testCases || [],
    }),
  };
}
