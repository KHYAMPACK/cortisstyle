"use client";

import { useEffect } from "react";
import { isSaveShortcut } from "@/lib/tr/panel/saveModel";

/**
 * Ctrl/Cmd+S runs `onSave` while `enabled`, and keeps the browser's own "save
 * page" dialog from opening. Every editor and drawer with a Kaydet button uses it.
 */
export function useSaveShortcut(onSave: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isSaveShortcut(event)) return;
      event.preventDefault();
      onSave();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled, onSave]);
}
