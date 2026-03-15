import { Navigate, Outlet } from 'react-router-dom';

const PublicRoutes = ({ isAuthenticated, redirectTo }) => {
  return !isAuthenticated ? <Outlet /> : <Navigate to={redirectTo} />;
};

export default PublicRoutes;
