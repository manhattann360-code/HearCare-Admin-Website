import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { ConfirmDialog } from '@/components/ui/Modal';

/**
 * Warn the user before leaving a page with unsaved changes (route change, refresh, closing the tab).
 * Call `allowNext()` right before navigating away after a successful save.
 */
export function useUnsavedChanges(dirty: boolean) {
  const bypass = useRef(false);
  const blocker = useBlocker(() => dirty && !bypass.current);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (bypass.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const dialog = (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title="Leave without saving?"
      message="You have changes that are not saved yet. If you leave now, they will be lost."
      confirmLabel="Leave without saving"
      cancelLabel="Stay on this page"
      tone="danger"
      onConfirm={() => blocker.state === 'blocked' && blocker.proceed()}
      onCancel={() => blocker.state === 'blocked' && blocker.reset()}
    />
  );

  return {
    dialog,
    allowNext: () => {
      bypass.current = true;
    },
    resume: () => {
      bypass.current = false;
    },
  };
}
