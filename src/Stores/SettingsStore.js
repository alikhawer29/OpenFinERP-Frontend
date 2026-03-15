import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updatePrint, updateAccountBalance, updateBackToBack } from '../Services/Settings';

// define the initial state
const initialState = {
  settings: {
    print: {},
    accountBalance: {},
    backToBack: {},
    selected_branch: {
      id: null,
    },
  },
  isUpdating: false,
  error: null,
};

const useSettingsStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Function to set all settings at once
      setSettings: (settingsData) => set({ settings: settingsData.settings }),

      getPrintSettings: (voucherType) => {
        const { settings } = get();
        return settings.print?.[voucherType] || false;
      },

      setPrintSettings: (printSettings) => {
        const { settings } = get();
        set({
          settings: {
            ...settings,
            print: printSettings,
          },
        });
      },
      // Generic function to update any print setting with API call
      updatePrintSetting: async (settingKey, value) => {
        const { settings } = get();

        // Update the specific print setting in the print object
        const updatedPrint = {
          ...settings.print,
          [settingKey]: value,
        };

        // Optimistically update local state
        set({
          settings: {
            ...settings,
            print: updatedPrint,
          },
          isUpdating: true,
          error: null,
        });

        // Make API call to persist the change using the updatePrint service
        try {
          const result = await updatePrint(settingKey, value);

          if (result.status === true) {
            set({ isUpdating: false });
            return true;
          } else {
            set({
              settings: settings, // Revert to previous state
              isUpdating: false,
              error: result.message || 'Failed to update settings',
            });
            return false;
          }
        } catch (error) {
          // Revert to previous state on failure
          set({
            settings: settings,
            isUpdating: false,
            error: error.message || 'Failed to update settings',
          });
          return false;
        }
      },

      getAccountBalanceSettings: (voucherType) => {
        const { settings } = get();
        return settings.accountBalance?.[voucherType] || false;
      },

      setAccountBalanceSettings: (accountBalanceSettings) => {
        const { settings } = get();
        set({
          settings: {
            ...settings,
            accountBalance: accountBalanceSettings,
          },
        });
      },
      // Generic function to update any account balance setting with API call
      updateAccountBalanceSetting: async (settingKey, value) => {
        const { settings } = get();

        // Update the specific account balance setting in the accountBalance object
        const updatedAccountBalance = {
          ...settings.accountBalance,
          [settingKey]: value,
        };

        // Optimistically update local state
        set({
          settings: {
            ...settings,
            accountBalance: updatedAccountBalance,
          },
          isUpdating: true,
          error: null,
        });

        // Make API call to persist the change using the updateAccountBalance service
        try {
          const result = await updateAccountBalance(settingKey, value);

          if (result.status === true) {
            set({ isUpdating: false });
            return true;
          } else {
            set({
              settings: settings, // Revert to previous state
              isUpdating: false,
              error:
                result.message || 'Failed to update account balance settings',
            });
            return false;
          }
        } catch (error) {
          // Revert to previous state on failure
          set({
            settings: settings,
            isUpdating: false,
            error: error.message || 'Failed to update account balance settings',
          });
          return false;
        }
      },

      getBackToBackSettings: (voucherType) => {
        const { settings } = get();
        return settings.backToBack?.[voucherType] || false;
      },

      setBackToBackSettings: (backToBackSettings) => {
        const { settings } = get();
        set({
          settings: {
            ...settings,
            backToBack: backToBackSettings,
          },
        });
      },
      // Generic function to update any back to back setting with API call
      updateBackToBackSetting: async (settingKey, value) => {
        const { settings } = get();

        // Update the specific back to back setting in the backToBack object
        const updatedBackToBack = {
          ...settings.backToBack,
          [settingKey]: value,
        };

        // Optimistically update local state
        set({
          settings: {
            ...settings,
            backToBack: updatedBackToBack,
          },
          isUpdating: true,
          error: null,
        });

        // Make API call to persist the change using the updateBackToBack service
        try {
          const result = await updateBackToBack(settingKey, value);

          if (result.status === true) {
            set({ isUpdating: false });
            return true;
          } else {
            set({
              settings: settings, // Revert to previous state
              isUpdating: false,
              error:
                result.message || 'Failed to update back to back settings',
            });
            return false;
          }
        } catch (error) {
          // Revert to previous state on failure
          set({
            settings: settings,
            isUpdating: false,
            error: error.message || 'Failed to update back to back settings',
          });
          return false;
        }
      },

      // Function to set selected branch
      setSelectedBranch: (branchData) => {
        const { settings } = get();
        set({
          settings: {
            ...settings,
            selected_branch: branchData,
          },
        });
      },

      // Function to reset settings to default
      resetSettings: () => set(initialState),

      // Clear any error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'settings-storage', // Key for localStorage
      partialize: (state) => ({ settings: state.settings }), // Only persist the settings part
    }
  )
);

export default useSettingsStore;
