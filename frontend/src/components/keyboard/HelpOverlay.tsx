import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HelpOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutEntry[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Global',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open Command Palette' },
      { keys: ['?'], description: 'Toggle this help overlay' },
      { keys: ['Esc'], description: 'Close any open dialog' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'O'], description: 'Go to Orders' },
      { keys: ['G', 'M'], description: 'Go to Menu' },
      { keys: ['G', 'T'], description: 'Go to Tables' },
      { keys: ['G', 'K'], description: 'Go to Kitchen' },
      { keys: ['G', 'I'], description: 'Go to Inventory' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
    ],
  },
  {
    title: 'Orders Page',
    shortcuts: [
      { keys: ['N'], description: 'New Order' },
      { keys: ['/'], description: 'Focus search' },
      { keys: ['1-5'], description: 'Switch tabs (All, Pending, Preparing, Ready, Completed)' },
    ],
  },
  {
    title: 'Menu Page',
    shortcuts: [
      { keys: ['N'], description: 'Add Menu Item' },
      { keys: ['/'], description: 'Focus search' },
      { keys: ['C'], description: 'Manage Categories' },
      { keys: ['1-N'], description: 'Switch category tabs' },
    ],
  },
  {
    title: 'Other Pages',
    shortcuts: [
      { keys: ['N'], description: 'Create new (Tables, Staff)' },
    ],
  },
];

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-xs font-mono font-medium bg-muted border border-border rounded shadow-sm">
    {children}
  </kbd>
);

export const HelpOverlay = ({ open, onOpenChange }: HelpOverlayProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
        <DialogDescription>
          Use these shortcuts to navigate and perform actions quickly.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6">
        {shortcutGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.description}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-xs text-muted-foreground">then</span>
                        )}
                        <Kbd>{key}</Kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
        Press <Kbd>?</Kbd> to toggle this help
      </p>
    </DialogContent>
  </Dialog>
);
