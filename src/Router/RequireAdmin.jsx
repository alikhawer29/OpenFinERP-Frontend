import { Navigate, Outlet } from 'react-router-dom';

const RequireAdmin = ({ isAuthenticated, userRole, redirectTo }) => {
  return isAuthenticated && userRole === 'admin' ? (
    <Outlet />
  ) : (
    <Navigate to={redirectTo} />
  );
};

export default RequireAdmin;
