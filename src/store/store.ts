import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { recordClientReducer } from './slices';

const rootReducer = combineReducers({
  recordClient: recordClientReducer,
});

export const setupStore = () => {
  return configureStore({
    reducer: rootReducer,
  });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];

