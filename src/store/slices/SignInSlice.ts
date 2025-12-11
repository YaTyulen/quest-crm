import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SignInState {
  isAuth: boolean; // авторизован ли пользователь (true - авторизован, false - не авторизован)
}

const currentIsAuth = (localStorage.getItem('isAuth') === 'true');

const initialState: SignInState = {
  isAuth: currentIsAuth,
};

export const signInSlice = createSlice({
  name: 'signIn',
  initialState,
  reducers: {
    setIsAuth(state, action: PayloadAction<boolean>) {
      state.isAuth = action.payload;
    },
  },
});

export default signInSlice.reducer;
