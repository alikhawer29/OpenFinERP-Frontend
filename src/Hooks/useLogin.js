import { useMutation } from '@tanstack/react-query';
import { loginAdmin, loginUser } from '../Services/Auth';
import useUserStore from '../Stores/UserStore';
import useSettingsStore from '../Stores/SettingsStore';
import { showErrorToast } from '../Utils/Utils';
import { getSettings } from '../Services/Settings';

export function useLogin(role = 'business') {
  const {
    setUser,
    setRole,
    setToken,
    setSubscriptionAccessStatus,
    setIsProfileCompleted,
    setSelectedBranch,
    setBranchName,
    setAccessRights,
    setAccountsPermission,
  } = useUserStore();

  const { setSettings } = useSettingsStore();

  return useMutation({
    // mutationFn: role === 'admin' ? loginAdmin : loginUser,
    mutationFn: (credentials) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const payload = { ...credentials, time_zone: timezone };

      return role === 'admin'
        ? loginAdmin(payload)
        : loginUser(payload);
    },
    onSuccess: async (data) => {
      // Set the user in the store upon successful login
      setUser(data.user);
      setRole(data.role);
      setToken(data.token);
      setSubscriptionAccessStatus(
        data.user.has_subscription_full_access ?? 'no_access'
      );
      setIsProfileCompleted(data.user.complete_profile);
      setSelectedBranch(data.user.selected_branch);
      setBranchName(data.user.branch_name);
      
      // Save access rights and accounts permission if available
      if (data.user.access_rights) {
        setAccessRights(data.user.access_rights);
      }
      if (data.user.accounts_permission) {
        setAccountsPermission(data.user.accounts_permission);
      }
      
      // Set cookie with JavaScript
      document.cookie = `token=${data.token}; path=/; secure; samesite=strict`;
      if (role !== 'admin') {
        try {
          const settingsResponse = await getSettings();
          if (settingsResponse) {
            setSettings(settingsResponse);
          } else {
            showErrorToast(
              settingsResponse.message || 'Failed to fetch settings'
            );
          }
        } catch (error) {
          showErrorToast('Failed to fetch settings');
          console.error('Settings fetch failed:', error);
        }
      }
    },
    onError: (error) => {
      showErrorToast(error);
      // Handle errors here (e.g., display a notification)
      console.error('Login Failed', error);
    },
  });
}
