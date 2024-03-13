import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './redux/store';
const container = document.getElementById('root');
const root = createRoot(container);
root.render(_jsxs(Provider, { store: store, children: [" ", _jsx(App, {}), " "] }));
