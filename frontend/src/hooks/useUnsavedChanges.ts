import { useEffect } from 'react';

interface UseUnsavedChangesProps {
  isDirty: boolean;
  message?: string;
}

export function useUnsavedChanges({ isDirty, message = 'You have unsaved changes. Are you sure you want to leave?' }: UseUnsavedChangesProps) {
  // Handle browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message]);
}
