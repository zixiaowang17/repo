#!/usr/bin/env node

import { setOutput } from "../output.js";
import {
  createTaskDeadlineEpochSeconds,
  parseTaskTimeoutMinutes,
  taskFinalizationGraceSeconds,
} from "../task-deadline.js";

export function runResolveTaskDeadlineCli(
  env: NodeJS.ProcessEnv = process.env,
  nowMilliseconds: number = Date.now(),
): number {
  try {
    const timeoutMinutes = parseTaskTimeoutMinutes(env.TASK_TIMEOUT_MINUTES);
    const deadlineEpochSeconds = createTaskDeadlineEpochSeconds(timeoutMinutes, nowMilliseconds);
    const finalizationGraceSeconds = taskFinalizationGraceSeconds(timeoutMinutes);
    setOutput("epoch_seconds", String(deadlineEpochSeconds));
    setOutput("finalization_grace_seconds", String(finalizationGraceSeconds));
    console.log(
      `task deadline: ${deadlineEpochSeconds}; finalization grace: ${finalizationGraceSeconds} seconds`,
    );
    return 0;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Invalid task deadline: ${message}`);
    return 2;
  }
}

if (require.main === module) {
  process.exitCode = runResolveTaskDeadlineCli();
}
