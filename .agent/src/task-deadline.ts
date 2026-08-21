import { MAX_TASK_TIMEOUT_MINUTES } from "./task-timeout-policy.js";

export const MAX_TASK_FINALIZATION_GRACE_SECONDS = 300;
export const MIN_TASK_FINALIZATION_GRACE_SECONDS = 15;

export function parseTaskTimeoutMinutes(value: unknown): number {
  const text = String(value ?? "").trim();
  const minutes = Number(text);
  if (!/^\d+$/u.test(text) || !Number.isInteger(minutes) || minutes <= 0) {
    throw new Error("TASK_TIMEOUT_MINUTES must be a positive integer");
  }
  if (minutes > MAX_TASK_TIMEOUT_MINUTES) {
    throw new Error(`TASK_TIMEOUT_MINUTES must be at most ${MAX_TASK_TIMEOUT_MINUTES}`);
  }
  return minutes;
}

export function createTaskDeadlineEpochSeconds(
  timeoutMinutes: number,
  nowMilliseconds: number = Date.now(),
): number {
  const minutes = parseTaskTimeoutMinutes(timeoutMinutes);
  return Math.floor(nowMilliseconds / 1000) + minutes * 60;
}

export function taskFinalizationGraceSeconds(timeoutMinutes: number): number {
  const totalSeconds = parseTaskTimeoutMinutes(timeoutMinutes) * 60;
  return Math.min(
    MAX_TASK_FINALIZATION_GRACE_SECONDS,
    Math.max(MIN_TASK_FINALIZATION_GRACE_SECONDS, Math.floor(totalSeconds / 10)),
    Math.floor(totalSeconds / 2),
  );
}

export function resolveAgentTimeoutSeconds(
  env: NodeJS.ProcessEnv = process.env,
  nowMilliseconds: number = Date.now(),
): number {
  const timeoutMinutes = parseTaskTimeoutMinutes(env.AGENT_TASK_TIMEOUT_MINUTES);
  const deadlineText = String(env.AGENT_TASK_DEADLINE_EPOCH_SECONDS ?? "").trim();
  const deadlineEpochSeconds = Number(deadlineText);
  if (
    !/^\d+$/u.test(deadlineText) ||
    !Number.isSafeInteger(deadlineEpochSeconds) ||
    deadlineEpochSeconds <= 0
  ) {
    throw new Error("AGENT_TASK_DEADLINE_EPOCH_SECONDS must be a positive integer");
  }

  const nowEpochSeconds = Math.floor(nowMilliseconds / 1000);
  const remainingSeconds = deadlineEpochSeconds - nowEpochSeconds;
  const finalizationGraceSeconds = taskFinalizationGraceSeconds(timeoutMinutes);
  if (remainingSeconds <= finalizationGraceSeconds) {
    throw new Error(
      `Agent task has ${remainingSeconds} seconds left; ${finalizationGraceSeconds} seconds are reserved for finalization`,
    );
  }
  return remainingSeconds - finalizationGraceSeconds;
}
