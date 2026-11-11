import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/reduxHooks';
import type { Role } from '../types/roles';
import { BASE_PATH } from '../constants';
import { canManage } from '../utils/permissions';
interface PrivateRouteProps { allowedRoles: Role[]; children: React.ReactNode; }
const PrivateRoute = ({ allowedRoles, children }: PrivateRouteProps) => {
  const { user } = useAppSelector(state => state.signIn);
  const permitted = user && allowedRoles.some(role => role === 'admin'
    ? canManage(user.systemRole)
    : user.businessRoles.includes(role === 'actor' ? 'ACTOR' : 'OPERATOR'));
  if (!permitted) return <Navigate to={`/${BASE_PATH}/home`} replace />;
  return <>{children}</>;
};
export default PrivateRoute;
