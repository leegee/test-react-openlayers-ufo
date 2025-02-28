import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import config from '@ufo-monorepo/config';
import { store } from './redux/store';
import { setupLocale } from './components/LocaleManager';
import App from './App';

import './main.css';
import './App.css';

console.info(`Locale: ${config.locale}`);
console.info(`Config: ${JSON.stringify(config, null, 4)}`);

await setupLocale();

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <Provider store={store}>
      <App />
    </Provider>
  );
} else {
  console.error('Could not find #root');
}