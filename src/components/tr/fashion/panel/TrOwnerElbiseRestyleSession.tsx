"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TrOwnerElbiseRestyleQueue } from "@/components/tr/fashion/panel/TrOwnerElbiseRestyleQueue";
import type { TrProduct } from "@/types/tr-marketplace";

export interface OpenElbiseRestyleArgs {
  boutiqueId: string;
  boutiqueSlug?: string | null;
  products: TrProduct[];
  initiallyCheckedIds?: string[];
  initialModelId?: string | null;
}

type SavedListener = (product: TrProduct) => void;
type ModelListener = (modelId: string) => void;

interface ElbiseRestyleSessionContextValue {
  open: (args: OpenElbiseRestyleArgs) => void;
  subscribeSaved: (listener: SavedListener) => () => void;
  subscribeModelLocked: (listener: ModelListener) => () => void;
}

const ElbiseRestyleSessionContext =
  createContext<ElbiseRestyleSessionContextValue | null>(null);

export function TrOwnerElbiseRestyleProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] = useState<OpenElbiseRestyleArgs | null>(null);
  const [sessionId, setSessionId] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeRef = useRef(false);
  const savedListeners = useRef(new Set<SavedListener>());
  const modelListeners = useRef(new Set<ModelListener>());

  const open = useCallback((args: OpenElbiseRestyleArgs) => {
    if (activeRef.current) {
      setSheetOpen(true);
      return;
    }
    activeRef.current = true;
    setSession(args);
    setSessionId((current) => current + 1);
    setSheetOpen(true);
  }, []);

  const expand = useCallback(() => setSheetOpen(true), []);
  const minimize = useCallback(() => setSheetOpen(false), []);
  const end = useCallback(() => {
    activeRef.current = false;
    setSheetOpen(false);
    setSession(null);
  }, []);

  const subscribeSaved = useCallback((listener: SavedListener) => {
    savedListeners.current.add(listener);
    return () => {
      savedListeners.current.delete(listener);
    };
  }, []);

  const subscribeModelLocked = useCallback((listener: ModelListener) => {
    modelListeners.current.add(listener);
    return () => {
      modelListeners.current.delete(listener);
    };
  }, []);

  const notifySaved = useCallback((product: TrProduct) => {
    for (const listener of savedListeners.current) listener(product);
  }, []);

  const notifyModelLocked = useCallback((modelId: string) => {
    for (const listener of modelListeners.current) listener(modelId);
  }, []);

  const value = useMemo(
    () => ({
      open,
      subscribeSaved,
      subscribeModelLocked,
    }),
    [open, subscribeSaved, subscribeModelLocked],
  );

  return (
    <ElbiseRestyleSessionContext.Provider value={value}>
      {children}
      {session ? (
        <TrOwnerElbiseRestyleQueue
          sessionId={sessionId}
          sheetOpen={sheetOpen}
          boutiqueId={session.boutiqueId}
          boutiqueSlug={session.boutiqueSlug}
          products={session.products}
          initiallyCheckedIds={session.initiallyCheckedIds}
          initialModelId={session.initialModelId}
          onMinimize={minimize}
          onExpand={expand}
          onEnd={end}
          onProductSaved={notifySaved}
          onModelLocked={notifyModelLocked}
        />
      ) : null}
    </ElbiseRestyleSessionContext.Provider>
  );
}

export function useOpenElbiseRestyle() {
  return useContext(ElbiseRestyleSessionContext)?.open ?? null;
}

export function useElbiseRestyleSaved(handler: SavedListener) {
  const subscribe = useContext(ElbiseRestyleSessionContext)?.subscribeSaved;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!subscribe) return;
    return subscribe((product) => handlerRef.current(product));
  }, [subscribe]);
}

export function useElbiseRestyleModelLocked(handler: ModelListener) {
  const subscribe = useContext(ElbiseRestyleSessionContext)?.subscribeModelLocked;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!subscribe) return;
    return subscribe((modelId) => handlerRef.current(modelId));
  }, [subscribe]);
}
