interface KeyboardShortcutHintProps {
  shortcut: string;
}

export const KeyboardShortcutHint = ({ shortcut }: KeyboardShortcutHintProps) => (
  <kbd className="ml-2 text-xs text-muted-foreground/60 font-mono border rounded px-1">
    {shortcut}
  </kbd>
);
