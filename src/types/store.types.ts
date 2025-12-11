import type { setupStore } from '../store/store';

// Типы для хуков и компонентов
export type AppStore = ReturnType<typeof setupStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
