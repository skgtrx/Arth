import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

registerSW({ immediate: true });

// GitHub Pages SPA: restore deep-link path from 404.html redirect
const ghpParam = new URLSearchParams(window.location.search).get('ghp');
if (ghpParam) {
  window.history.replaceState(null, '', '/arth' + decodeURIComponent(ghpParam));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
