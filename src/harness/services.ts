import type { ZodType } from "zod";
import type { LlmProvider } from "./provider";
import { callWithValidation } from "./validated";

// NOTE: ts-fsrs stays installed but unused here. Scheduling, pass/fail
// rules, and any spaced-repetition wrapping are the user's design space —
// this plumbing only moves prompts to the provider and validates JSON.

const RETRY_NOTE = "Return ONLY valid JSON matching the requested shape, no prose.";
const MAX_PROMPT_LENGTH = 20000;

function assertValidPrompt(prompt: string): void {
  if (typeof prompt !== "string" || prompt.length === 0 || prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error("prompt must be a non-empty string of at most 20000 characters");
  }
}

// HUMAN: prompt design is yours — each service takes a caller-built `prompt`
// string and passes it through untouched. No prompt text lives in this file.
export async function generateLesson<T>(
  provider: LlmProvider,
  prompt: string,
  schema: ZodType<T>,
): Promise<T> {
  assertValidPrompt(prompt);
  return callWithValidation(provider, [{ role: "user", content: prompt }], schema, RETRY_NOTE);
}

// HUMAN: prompt design is yours — each service takes a caller-built `prompt`
// string and passes it through untouched. No prompt text lives in this file.
export async function generateProblems<T>(
  provider: LlmProvider,
  prompt: string,
  schema: ZodType<T>,
): Promise<T> {
  assertValidPrompt(prompt);
  return callWithValidation(provider, [{ role: "user", content: prompt }], schema, RETRY_NOTE);
}

// HUMAN: prompt design is yours — each service takes a caller-built `prompt`
// string and passes it through untouched. No prompt text lives in this file.
export async function gradeAttempt<T>(
  provider: LlmProvider,
  prompt: string,
  schema: ZodType<T>,
): Promise<T> {
  assertValidPrompt(prompt);
  return callWithValidation(provider, [{ role: "user", content: prompt }], schema, RETRY_NOTE);
}

// HUMAN: prompt design is yours — each service takes a caller-built `prompt`
// string and passes it through untouched. No prompt text lives in this file.
export async function updateLearnerProfile<T>(
  provider: LlmProvider,
  prompt: string,
  schema: ZodType<T>,
): Promise<T> {
  assertValidPrompt(prompt);
  return callWithValidation(provider, [{ role: "user", content: prompt }], schema, RETRY_NOTE);
}
