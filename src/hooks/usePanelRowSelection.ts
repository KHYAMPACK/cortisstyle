"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { PanelSelectModifiers } from "@/components/tr/panel/PanelSelectCheckbox";

export interface PanelRowSelection {
  selectedIds: Set<string>;
  selectedCount: number;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  isSelected: (id: string) => boolean;
  /** Checkbox click — Shift range, Ctrl/Cmd add range, plain set from nextChecked. */
  onItemClick: (id: string, modifiers: PanelSelectModifiers) => void;
  /** Header “select all” for the current ordered list. */
  setAllVisible: (checked: boolean) => void;
  clear: () => void;
  selectAll: () => void;
  /** Ctrl/Cmd+A select all, Escape clear — attach to table wrapper. */
  onKeyDown: (event: ReactKeyboardEvent) => void;
}

/**
 * Classic desktop multi-select for panel tables:
 * - click: toggle one row (sets range anchor)
 * - Shift+click: select inclusive range from anchor
 * - Ctrl/Cmd+Shift+click: add range to selection
 * - Ctrl/Cmd+A: select all visible
 * - Escape: clear
 */
export function usePanelRowSelection(orderedIds: string[]): PanelRowSelection {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const anchorIdRef = useRef<string | null>(null);
  const orderedIdsRef = useRef(orderedIds);
  orderedIdsRef.current = orderedIds;

  // Stable key so we only prune when the id set actually changes.
  const orderedKey = orderedIds.join("\0");

  useEffect(() => {
    const allowed = new Set(orderedIdsRef.current);
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (allowed.has(id)) next.add(id);
        else changed = true;
      }
      if (anchorIdRef.current && !allowed.has(anchorIdRef.current)) {
        anchorIdRef.current = null;
      }
      return changed ? next : prev;
    });
  }, [orderedKey]);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    anchorIdRef.current = null;
  }, []);

  const selectAll = useCallback(() => {
    const ids = orderedIdsRef.current;
    setSelectedIds(new Set(ids));
    anchorIdRef.current = ids[ids.length - 1] ?? null;
  }, []);

  const setAllVisible = useCallback((checked: boolean) => {
    const ids = orderedIdsRef.current;
    if (checked) {
      setSelectedIds(new Set(ids));
      anchorIdRef.current = ids[ids.length - 1] ?? null;
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  }, []);

  const onItemClick = useCallback(
    (id: string, modifiers: PanelSelectModifiers) => {
      const ids = orderedIdsRef.current;
      const index = ids.indexOf(id);
      if (index < 0) return;

      const multi = modifiers.metaKey || modifiers.ctrlKey;

      if (modifiers.shiftKey && anchorIdRef.current) {
        const anchorIndex = ids.indexOf(anchorIdRef.current);
        if (anchorIndex >= 0) {
          const from = Math.min(anchorIndex, index);
          const to = Math.max(anchorIndex, index);
          const range = ids.slice(from, to + 1);
          if (multi) {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              for (const entry of range) next.add(entry);
              return next;
            });
          } else {
            setSelectedIds(new Set(range));
          }
          return;
        }
      }

      setSelectedIds((prev) => {
        const next = new Set(prev);
        const shouldSelect =
          typeof modifiers.nextChecked === "boolean"
            ? modifiers.nextChecked
            : !prev.has(id);
        if (shouldSelect) next.add(id);
        else next.delete(id);
        return next;
      });
      anchorIdRef.current = id;
    },
    [],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        selectAll();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        clear();
      }
    },
    [clear, selectAll],
  );

  const allVisibleSelected =
    orderedIds.length > 0 && orderedIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = orderedIds.some((id) => selectedIds.has(id));

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    allVisibleSelected,
    someVisibleSelected,
    isSelected,
    onItemClick,
    setAllVisible,
    clear,
    selectAll,
    onKeyDown,
  };
}
