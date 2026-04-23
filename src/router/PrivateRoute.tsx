import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/reduxHooks';
import type { Role } from '../types/roles';
import { BASE_PATH } from '../constants';

interface PrivateRouteProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

const PrivateRoute = ({ allowedRoles, children }: PrivateRouteProps) => {
  const { role } = useAppSelector((state) => state.signIn);

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={`/${BASE_PATH}/home`} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
