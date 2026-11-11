import { useAppSelector } from './reduxHooks';
import { logout } from '../api/auth';
export const useAuth = () => {
  const { user, loading } = useAppSelector(state => state.signIn);
  return { user, loading, signOut: logout };
};
