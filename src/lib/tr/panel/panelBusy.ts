/**
 * What the panel is waiting on right now (a save, a delete, an upload), so one shared
 * indicator (`TrPanelBusyIndicator`) can show it wherever it was started. Every owner
 * request that changes something registers itself (`ownerFetch`); anything else that
 * makes the owner wait can use `trackPanelTask`.
 */

export interface PanelTask {
  id: number;
  label: string;
  startedAt: number;
}

type Listener = () => void;

let tasks: readonly PanelTask[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

/** Starts a task; call the returned function when it is over (safe to call twice). */
export function beginPanelTask(label: string): () => void {
  const id = nextId++;
  tasks = [...tasks, { id, label, startedAt: Date.now() }];
  emit();
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    tasks = tasks.filter((task) => task.id !== id);
    emit();
  };
}

/** Runs `work` as a task: shown while it runs, removed when it settles. */
export async function trackPanelTask<T>(label: string, work: () => Promise<T>): Promise<T> {
  const end = beginPanelTask(label);
  try {
    return await work();
  } finally {
    end();
  }
}

export function subscribePanelTasks(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The running tasks, oldest first (a stable array between changes). */
export function getPanelTasks(): readonly PanelTask[] {
  return tasks;
}

const EMPTY: readonly PanelTask[] = [];

/** No task on the server render. */
export function getServerPanelTasks(): readonly PanelTask[] {
  return EMPTY;
}

/** The label to show: the newest task's, with a count when several run at once. */
export function panelBusyLabel(running: readonly PanelTask[]): string | null {
  const newest = running[running.length - 1];
  if (!newest) return null;
  return running.length > 1 ? `${newest.label} (${running.length})` : newest.label;
}

/** The wait label for a request that changes something, by its HTTP method. */
export function panelRequestLabel(method: string | undefined): string | null {
  switch ((method ?? "GET").toUpperCase()) {
    case "POST":
    case "PATCH":
    case "PUT":
      return "Kaydediliyor…";
    case "DELETE":
      return "Siliniyor…";
    default:
      return null;
  }
}
