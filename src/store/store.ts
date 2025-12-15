import { combineReducers, configureStore } from '@reduxjs/toolkit';

import {recordClientReducer, signInReducer} from './slices';

// Собираем все редьюсеры
const rootReducer = combineReducers({
  signIn: signInReducer,
  recordClient: recordClientReducer,
});

// Функция для создания store
export const setupStore = () => {
  return configureStore({
    reducer: rootReducer,
  });
};
