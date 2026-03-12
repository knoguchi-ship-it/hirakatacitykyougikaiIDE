import React from 'react';
import { createRoot } from 'react-dom/client';
import PublicApp from './App';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <PublicApp />
    </React.StrictMode>
  );
}
