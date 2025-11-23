import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import './index.css';
import App from './App.tsx';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <MantineProvider>
        <App />
      </MantineProvider>
    </StrictMode>,
  );
}

export default root;
