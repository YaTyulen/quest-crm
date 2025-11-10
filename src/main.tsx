import { createRoot } from 'react-dom/client';
import './index.scss';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { setupStore } from './store/store.ts';
import { Provider } from 'react-redux';

const store = setupStore();

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);
