/**
 * Client-side limiter for owner FASHN packshot / try-on calls.
 * Upload + Gemini prepare stay outside the queue so listing fields unlock
 * while catalog jobs wait their turn.
 */

export const OWNER_AI_JOB_CONCURRENCY = 2;

export interface ScheduleAiJobOptions {
  onStart?: () => void;
}

export type ScheduleAiJob = <T>(
  run: () => Promise<T>,
  options?: ScheduleAiJobOptions,
) => Promise<T>;

export function createOwnerAiJobQueue(
  concurrency = OWNER_AI_JOB_CONCURRENCY,
): { schedule: ScheduleAiJob } {
  const limit = Math.max(1, concurrency);
  let active = 0;
  const waiting: Array<() => void> = [];

  function pump() {
    while (active < limit && waiting.length > 0) {
      const next = waiting.shift();
      next?.();
    }
  }

  const schedule: ScheduleAiJob = (run, options) => {
    return new Promise((resolve, reject) => {
      const start = () => {
        active += 1;
        options?.onStart?.();
        Promise.resolve()
          .then(run)
          .then(resolve, reject)
          .finally(() => {
            active -= 1;
            pump();
          });
      };
      if (active < limit) {
        start();
      } else {
        waiting.push(start);
      }
    });
  };

  return { schedule };
}

export const runAiJobImmediately: ScheduleAiJob = (run, options) => {
  options?.onStart?.();
  return run();
};
