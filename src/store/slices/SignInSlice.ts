import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Role } from '../../types/roles';

interface SignInState {
  isAuth: boolean;
  role: Role | null;
}

const currentIsAuth = localStorage.getItem('isAuth') === 'true';
const currentRole = (localStorage.getItem('role') as Role) || null;

const initialState: SignInState = {
  isAuth: currentIsAuth,
  role: currentRole,
};

export const signInSlice = createSlice({
  name: 'signIn',
  initialState,
  reducers: {
    setIsAuth(state, action: PayloadAction<boolean>) {
      state.isAuth = action.payload;
      if (!action.payload) {
        state.role = null;
        localStorage.removeItem('role');
      }
    },
    setRole(state, action: PayloadAction<Role>) {
      state.role = action.payload;
      localStorage.setItem('role', action.payload);
    },
  },
});

export default signInSlice.reducer;
