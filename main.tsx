import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import OracleTokenApp from './app';

// Make Buffer available globally
window.Buffer = Buffer;
globalThis.Buffer = Buffer;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OracleTokenApp />
  </React.StrictMode>
);
