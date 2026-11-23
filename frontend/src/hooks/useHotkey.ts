import { useEffect, useEffectEvent } from "react";

/**
 * Runs `handler` when `key` is pressed without modifiers,
 * except while typing in a field.
 * */
export function useHotkey(key: string, handler: () => void) {
  const onKey = useEffectEvent(handler);

  useEffect(() => {
    function listener(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== key || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      const target = e.target as HTMLElement;
      if (
        target.isContentEditable ||
        target.closest("input, textarea, select")
      ) {
        return;
      }
      // Keeps the key from being typed into whatever gets focused
      e.preventDefault();
      onKey();
    }

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [key]);
}
