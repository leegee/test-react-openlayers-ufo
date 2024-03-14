import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { init } from 'react-intl-universal';

import App from './App';
import { store } from './redux/store';

const locales: Record<string, any> = {
  'en': import('./locales/en.json'),
  'no': import('./locales/no.json'),
};

const locale = 'en';

Promise.all([locales[locale]])
  .then(([translations]) => {
    init({
      currentLocale: locale,
      locales: { [locale]: translations.default },
    });

    const container = document.getElementById('root');
    const root = createRoot(container!);
    root.render(
      <Provider store={store}>
        <App />
      </Provider>
    );
  });
