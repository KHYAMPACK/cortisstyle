"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  createOwnerAiJobQueue,
  runAiJobImmediately,
  type ScheduleAiJob,
} from "@/lib/tr/aiCatalog/ownerAiJobQueue";

const OwnerAiJobQueueContext = createContext<ScheduleAiJob | null>(null);

/** Batch create wraps FASHN packshot/try-on. Wizard omits this — jobs run now. */
export function TrOwnerAiJobQueueProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queueRef = useRef(createOwnerAiJobQueue());
  const schedule = useCallback<ScheduleAiJob>((run, options) => {
    return queueRef.current.schedule(run, options);
  }, []);
  const value = useMemo(() => schedule, [schedule]);

  return (
    <OwnerAiJobQueueContext.Provider value={value}>
      {children}
    </OwnerAiJobQueueContext.Provider>
  );
}

export function useScheduleAiJob(): ScheduleAiJob {
  return useContext(OwnerAiJobQueueContext) ?? runAiJobImmediately;
}
