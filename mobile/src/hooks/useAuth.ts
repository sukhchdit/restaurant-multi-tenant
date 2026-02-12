import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { login as loginAction, logout as logoutAction } from '../store/slices/authSlice';
import { LoginRequest, UserRole } from '../types';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  return {
    ...auth,
    login: (credentials: LoginRequest) => dispatch(loginAction(credentials)),
    logout: () => dispatch(logoutAction()),
    hasRole: (role: UserRole) => auth.user?.roles.includes(role) ?? false,
  };
}
