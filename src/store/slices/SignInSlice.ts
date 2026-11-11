import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '../../types/roles';
interface SignInState {
  isAuth: boolean;
  user: UserProfile | null;
  loading: boolean;
}
const initialState: SignInState = { isAuth: false, user: null, loading: true };
export const signInSlice = createSlice({
  name: 'signIn', initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserProfile>) {
      state.user = action.payload;
      state.isAuth = true;
      state.loading = false;
    },
    clearUser(state) {
      state.user = null;
      state.isAuth = false;
      state.loading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) { state.loading = action.payload; },
  },
});
export default signInSlice.reducer;
