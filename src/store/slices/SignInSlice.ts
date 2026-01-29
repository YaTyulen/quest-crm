import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SignInState {
  isAuth: boolean; // авторизован ли пользователь (true - авторизован, false - не авторизован)
  role: 'admin' | 'user' | null;
}

const currentIsAuth = (localStorage.getItem('isAuth') === 'true');

const initialState: SignInState = {
  isAuth: currentIsAuth,
  role: null
};

export const signInSlice = createSlice({
  name: 'signIn',
  initialState,
  reducers: {
    setIsAuth(state, action: PayloadAction<boolean>) {
      state.isAuth = action.payload;
    },
    setRole(state, action: PayloadAction<'admin' | 'user'>) {
      state.role = action.payload;
    },
  },
});

export default signInSlice.reducer;
