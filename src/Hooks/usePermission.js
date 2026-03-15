import { useMemo } from 'react';
import useUserStore from '../Stores/UserStore';

export const usePermission = (parent, module, permissionKey) => {
  const { hasPermission } = useUserStore();

  return useMemo(() => {
    if (!parent || !module || !permissionKey) return false;
    return hasPermission(parent, module, permissionKey.toLowerCase());
  }, [parent, module, permissionKey, hasPermission]);
};

export default usePermission;

