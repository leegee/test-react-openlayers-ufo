import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { store } from './redux/store';
import { useLocale } from './LocaleManager';
import App from './App';

import './index.css';
import './App.css';

await useLocale();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
// });


