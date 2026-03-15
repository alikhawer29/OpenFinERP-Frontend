import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialState = {
  forms: {}, // Stores form values by formId
  lastVisitedPages: {}, // Tracks last visited external page per form (to repopulate form only if coming from the specific page)
};

const useFormStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      saveFormValues: (formId, values) => {
        const { forms } = get();
        set({
          forms: {
            ...forms,
            [formId]: {
              values,
              timestamp: Date.now(),
            },
          },
        });
      },

      getFormValues: (formId) => {
        const { forms } = get();
        return forms[formId]?.values || null;
      },

      hasFormValues: (formId) => {
        const { forms } = get();
        return !!forms[formId];
      },

      clearFormValues: (formId) => {
        const { forms } = get();
        const updatedForms = { ...forms };
        delete updatedForms[formId];
        set({ forms: updatedForms });
      },

      setLastVisitedPage: (formId, pageName) => {
        const { lastVisitedPages } = get();
        set({
          lastVisitedPages: {
            ...lastVisitedPages,
            [formId]: pageName,
          },
        });
      },

      getLastVisitedPage: (formId) => {
        const { lastVisitedPages } = get();
        return lastVisitedPages[formId] || null;
      },

      clearLastVisitedPage: (formId) => {
        const { lastVisitedPages } = get();
        const updatedPages = { ...lastVisitedPages };
        delete updatedPages[formId];
        set({ lastVisitedPages: updatedPages });
      },

      clearAllForms: () => set({ forms: {}, lastVisitedPages: {} }),
    }),
    {
      name: 'form-storage',
      partialize: (state) => ({
        forms: state.forms,
        lastVisitedPages: state.lastVisitedPages,
      }),
    }
  )
);

export default useFormStore;
