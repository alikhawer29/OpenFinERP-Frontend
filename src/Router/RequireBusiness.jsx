import { Navigate, Outlet } from 'react-router-dom';

const RequireBusiness = ({ isAuthenticated, userRole, redirectTo }) => {
  return isAuthenticated && (userRole === 'company' || userRole === 'user') ? (
    <Outlet />
  ) : (
    <Navigate to={redirectTo} />
  );
};

export default RequireBusiness;
