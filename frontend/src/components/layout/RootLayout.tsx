import { useState, useMemo } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { CommandPalette } from '@/components/keyboard/CommandPalette';
import { HelpOverlay } from '@/components/keyboard/HelpOverlay';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export const RootLayout = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const navigate = useNavigate();

  // Global shortcuts that work even in inputs (Ctrl+K)
  const globalShortcuts = useMemo(() => ({
    'ctrl+k': () => setPaletteOpen(true),
  }), []);

  useKeyboardShortcuts(globalShortcuts, { enableInInputs: true });

  // Navigation shortcuts (only outside inputs)
  const navShortcuts = useMemo(() => ({
    '?': () => setHelpOpen((prev) => !prev),
    'g>d': () => navigate('/'),
    'g>o': () => navigate('/orders'),
    'g>m': () => navigate('/menu'),
    'g>t': () => navigate('/tables'),
    'g>k': () => navigate('/kitchen'),
    'g>i': () => navigate('/inventory'),
    'g>s': () => navigate('/settings'),
  }), [navigate]);

  useKeyboardShortcuts(navShortcuts);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <HelpOverlay open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};
