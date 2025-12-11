import { combineReducers, configureStore } from '@reduxjs/toolkit';

import {signInReducer} from './slices';

// Собираем все редьюсеры
const rootReducer = combineReducers({
  signIn: signInReducer,
});

// Функция для создания store
export const setupStore = () => {
  return configureStore({
    reducer: rootReducer,
  });
};
