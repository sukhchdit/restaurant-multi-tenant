import { useEffect, useRef } from 'react';

interface UseKeyboardShortcutsOptions {
  enableInInputs?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enableInInputs = false } = options;
  const sequenceRef = useRef<{ key: string; time: number } | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip when focused on input elements unless enableInInputs is set
      if (!enableInInputs) {
        const tag = (document.activeElement?.tagName ?? '').toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
          return;
        }
        if ((document.activeElement as HTMLElement)?.isContentEditable) {
          return;
        }
      }

      // Build the key string for modifier combos
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.altKey) parts.push('alt');
      if (e.shiftKey && e.key.length > 1) parts.push('shift');
      parts.push(e.key.toLowerCase());
      const combo = parts.join('+');

      // Check for direct match (single keys or modifier combos)
      if (shortcuts[combo]) {
        e.preventDefault();
        shortcuts[combo]();
        sequenceRef.current = null;
        return;
      }

      // Check for sequence match (e.g. "g>d" = press G then D within 1s)
      const now = Date.now();
      const prev = sequenceRef.current;

      if (prev && now - prev.time < 1000) {
        const seq = `${prev.key}>${e.key.toLowerCase()}`;
        if (shortcuts[seq]) {
          e.preventDefault();
          shortcuts[seq]();
          sequenceRef.current = null;
          return;
        }
      }

      // Store the current key for potential sequence
      // Only store non-modifier single keys
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
        sequenceRef.current = { key: e.key.toLowerCase(), time: now };
      } else {
        sequenceRef.current = null;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts, enableInInputs]);
}
