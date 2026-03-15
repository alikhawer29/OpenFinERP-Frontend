import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define theme options
const themeOptions = ['dark-teal', 'purple', 'teal', 'blue', 'yellow'];

const useThemeStore = create(
  persist(
    (set) => ({
      theme: themeOptions[0], // Default theme

      // Function to set a specific theme
      setTheme: (newTheme) => {
        if (themeOptions.includes(newTheme)) {
          document.body.setAttribute('data-theme', newTheme);
          set({ theme: newTheme });
        } else {
          console.warn(`Theme ${newTheme} is not defined`);
        }
      },

      // Function to toggle through themes
      toggleTheme: () => {
        set((state) => {
          const currentIndex = themeOptions.indexOf(state.theme);
          const nextTheme =
            themeOptions[(currentIndex + 1) % themeOptions.length];
          document.body.setAttribute('data-theme', nextTheme);
          return { theme: nextTheme };
        });
      },
    }),
    {
      name: 'theme-storage', // Key for localStorage
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.body.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);

export default useThemeStore;
