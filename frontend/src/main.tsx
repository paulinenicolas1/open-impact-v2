import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Global, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import App from './App.tsx';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <MantineProvider
        defaultColorScheme="dark"
        theme={{
          fontFamily: 'Inter, Segoe UI, system-ui, sans-serif',
        }}
      >
        <Global
          styles={{
            '*, *::before, *::after': {
              boxSizing: 'border-box',
            },
            body: {
              margin: 0,
              backgroundColor: '#0f1116',
            },
          }}
        />
        <App />
      </MantineProvider>
    </StrictMode>,
  );
}

export default root;
