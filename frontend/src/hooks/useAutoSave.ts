import { useEffect, useState, useCallback, useRef } from 'react';
import { UseFormWatch, UseFormGetValues } from 'react-hook-form';

interface UseAutoSaveOptions<T> {
  watch: UseFormWatch<T>;
  getValues: UseFormGetValues<T>;
  storageKey: string;
  debounceMs?: number;
  enabled?: boolean;
  isDirty?: boolean; // Only save when form has changes
}

interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  hasDraft: boolean;
}

export function useAutoSave<T extends Record<string, any>>({
  watch,
  getValues,
  storageKey,
  debounceMs = 2000,
  enabled = true,
  isDirty = false
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>({
    isSaving: false,
    lastSaved: null,
    hasDraft: false
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);

  // Save draft to localStorage
  const saveDraft = useCallback((data: T) => {
    if (!enabled) return;

    try {
      setStatus(prev => ({ ...prev, isSaving: true }));

      const draftData = {
        formData: data,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(storageKey, JSON.stringify(draftData));

      setStatus({
        isSaving: false,
        lastSaved: new Date(),
        hasDraft: true
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      setStatus(prev => ({ ...prev, isSaving: false }));
    }
  }, [storageKey, enabled]);

  // Load draft from localStorage
  const loadDraft = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;

      const { formData, timestamp } = JSON.parse(saved);

      // Check if draft is less than 7 days old
      const draftAge = Date.now() - new Date(timestamp).getTime();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (draftAge > maxAge) {
        clearDraft();
        return null;
      }

      setStatus(prev => ({ ...prev, hasDraft: true, lastSaved: new Date(timestamp) }));
      return formData;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [storageKey]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setStatus({
        isSaving: false,
        lastSaved: null,
        hasDraft: false
      });
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [storageKey]);

  // Watch for form changes and auto-save
  useEffect(() => {
    if (!enabled) return;

    // Skip first render to avoid saving default values
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const subscription = watch(() => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for debounced save
      timeoutRef.current = setTimeout(() => {
        // Only save if form has changes
        if (!isDirty) return;

        const formData = getValues();
        saveDraft(formData);
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [watch, getValues, saveDraft, debounceMs, enabled, isDirty]);

  return {
    status,
    loadDraft,
    clearDraft,
    saveDraft: () => saveDraft(getValues())
  };
}
