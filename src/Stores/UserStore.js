import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// define the initial state
const initialState = {
  user: null, // Initially no user is logged in
  role: null, // Initially no user role is set
  branch_name: null,
  token: null,
  access_rights: null, // User access rights for modules (master, transactions, process, reports, administration)
  accounts_permission: null, // User account permissions
};

const useUserStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Function to set user on login
      setUser: (userData) => set({ user: userData }),

      // Function to set user role on login
      setRole: (role) => set({ role: role }),

      // Function to set user token on login
      setToken: (token) => set({ token: token }),

      setSubscriptionAccessStatus: (subscriptionAccess) => {
        const { user } = get();
        set({
          user: {
            ...(user || {}),
            has_subscription_full_access: subscriptionAccess,
          },
        });
      },

      // Function to set user selected branch on login
      setSelectedBranch: (selectedBranch) => {
        const { user } = get();
        set({ user: { ...user, selected_branch: selectedBranch } });
      },

      setBranchName: (branchName) => set({ branch_name: branchName }),

      //set base currency
      setBaseCurrency: (baseCurrency) => {
        const { user } = get();
        set({ user: { ...user, base_currency: baseCurrency } });
      },

      // Function to set user profile completion status on login
      setIsProfileCompleted: (isProfileCompleted) => {
        const { user } = get();
        set({ user: { ...user, complete_profile: isProfileCompleted } });
      },

      // Function to set user new account type on login
      setNewAccountType: (type) => {
        const { user } = get(); // Get the current user from the state
        set({ user: { ...user, party_ledgers_account_type: type } });
      },

      // Function to set access rights
      setAccessRights: (accessRights) => set({ access_rights: accessRights }),

      // Function to set account permissions
      setAccountsPermission: (accountsPermission) =>
        set({ accounts_permission: accountsPermission }),

      // Function to clear user on logout
      clearUser: () => set(initialState),

      // ✅ Add helper functions for access
      hasFullAccess: () => {
        //from backend
        //1-full_access - active subscription
        //2-restricted_access - grace period
        //3-no_access - expired subscription
        const { user } = get();
        return user?.has_subscription_full_access === 'full_access' ? true : false; //need to update in future
      },

      // Helper function to check if user has permission for a specific parent, module, and permission
      // parent: 'master', 'transactions', 'process', 'reports', 'administration'
      // module: 'teller_register', 'chart_of_account', 'journal_voucher', etc.
      // permission: 'view', 'create', 'edit', 'delete', 'print', etc.
      // Inside your store definition
      hasPermission: (parent, module, permission) => {
        const { access_rights, role } = get();

        // Only apply permission check for 'employee' role
        if (role !== 'employee') return true; // admins and users get full access by default

        if (!access_rights || !Array.isArray(access_rights)) return false;

        const normalizedParent = parent.toLowerCase();
        const normalizedModule = module.toLowerCase().replace(/\s+/g, '_');
        const normalizedPermission = permission.toLowerCase();

        return access_rights.some(
          (right) =>
            right.parent?.toLowerCase() === normalizedParent &&
            right.module?.toLowerCase() === normalizedModule &&
            right.permission?.toLowerCase() === normalizedPermission &&
            right.granted === 1
        );
      },

      hasFeaturePermission: (parent, module) => {
        const { access_rights, role } = get();

        // Only apply feature check for 'employee' role
        if (role !== 'employee') return true; // admins and users get full access by default

        if (!access_rights || !Array.isArray(access_rights)) return false;

        const normalizedParent = parent.toLowerCase();
        const normalizedModule = module.toLowerCase().replace(/\s+/g, '_');

        return access_rights.some(
          (right) =>
            right.parent?.toLowerCase() === normalizedParent &&
            right.module?.toLowerCase() === normalizedModule &&
            right.granted === 1
        );
      },


      // Helper function to check if user has access to a specific account code
      hasAccountPermission: (accountCode) => {
        const { accounts_permission } = get();
        if (!accounts_permission || !Array.isArray(accounts_permission))
          return false;
        return accounts_permission.some(
          (permission) =>
            permission.chart_of_account_code === accountCode &&
            permission.granted === 1
        );
      },

      // Helper function to get all permitted account codes
      getPermittedAccountCodes: () => {
        const { accounts_permission } = get();
        if (!accounts_permission || !Array.isArray(accounts_permission))
          return [];
        return accounts_permission
          .filter((permission) => permission.granted === 1)
          .map((permission) => permission.chart_of_account_code);
      },

    }),
    {
      name: 'user-storage', // Key for localStorage
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        access_rights: state.access_rights,
        accounts_permission: state.accounts_permission,
      }), // Persist user, role, access_rights, and accounts_permission
    }
  )
);

export default useUserStore;
