import useModulePermissions from './useModulePermissions';
export const useSidebarModuleAccess = (parent, module) => {
  const permissions = useModulePermissions(parent, module);
  return permissions.accessKey;
};

export default useSidebarModuleAccess;

