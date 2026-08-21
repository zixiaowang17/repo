import { test } from "node:test";
import { strict as assert } from "node:assert";

import {
  createTaskDeadlineEpochSeconds,
  parseTaskTimeoutMinutes,
  resolveAgentTimeoutSeconds,
  taskFinalizationGraceSeconds,
} from "../task-deadline.js";

test("task deadline uses the resolved workflow timeout", () => {
  assert.equal(createTaskDeadlineEpochSeconds(300, 1_000_000), 19_000);
  assert.equal(taskFinalizationGraceSeconds(300), 300);
  assert.equal(
    resolveAgentTimeoutSeconds(
      {
        AGENT_TASK_TIMEOUT_MINUTES: "300",
        AGENT_TASK_DEADLINE_EPOCH_SECONDS: "19000",
      },
      1_000_000,
    ),
    17_700,
  );
});

test("task deadline keeps a proportional grace period for shorter tasks", () => {
  assert.equal(taskFinalizationGraceSeconds(30), 180);
  assert.equal(taskFinalizationGraceSeconds(1), 15);
});

test("task deadline rejects missing and invalid inputs", () => {
  assert.throws(() => parseTaskTimeoutMinutes(""), /positive integer/);
  assert.throws(() => parseTaskTimeoutMinutes("1.5"), /positive integer/);
  assert.throws(() => parseTaskTimeoutMinutes("361"), /at most 360/);
  assert.throws(
    () => resolveAgentTimeoutSeconds({ AGENT_TASK_TIMEOUT_MINUTES: "30" }),
    /AGENT_TASK_DEADLINE_EPOCH_SECONDS/,
  );
});

test("task deadline rejects a run without finalization time", () => {
  assert.throws(
    () =>
      resolveAgentTimeoutSeconds(
        {
          AGENT_TASK_TIMEOUT_MINUTES: "30",
          AGENT_TASK_DEADLINE_EPOCH_SECONDS: "1100",
        },
        1_000_000,
      ),
    /reserved for finalization/,
  );
});
