import useUserStore from '../Stores/UserStore';

export const usePermissions = () => {
  const {
    access_rights,
    accounts_permission,
    hasPermission: storeHasPermission,
    hasFeaturePermission: storeHasFeaturePermission,
    hasAccountPermission: storeHasAccountPermission,
    getPermittedAccountCodes,
  } = useUserStore();

  return {
    // Direct access to permissions
    accessRights: access_rights,
    accountsPermission: accounts_permission,

    // Helper functions
    hasPermission: storeHasPermission,
    hasFeaturePermission: storeHasFeaturePermission,
    hasAccountPermission: storeHasAccountPermission,
    getPermittedAccountCodes,

    // Convenience methods for common permission checks
    // parent: 'master', 'transactions', 'process', 'reports', 'administration'
    // module: 'teller_register', 'chart_of_account', 'journal_voucher', etc.
    canView: (parent, module) => storeHasPermission(parent, module, 'view'),
    canCreate: (parent, module) => storeHasPermission(parent, module, 'create'),
    canEdit: (parent, module) => storeHasPermission(parent, module, 'edit'),
    canDelete: (parent, module) => storeHasPermission(parent, module, 'delete'),
    canPrint: (parent, module) => storeHasPermission(parent, module, 'print'),

    // Check if user has any permissions at all
    hasAnyPermissions: () => {
      return access_rights !== null && access_rights !== undefined;
    },
  };
};

export default usePermissions;

