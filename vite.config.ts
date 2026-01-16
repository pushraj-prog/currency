
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  // Fix: Use '.' as a fallback root path to satisfy TypeScript's 'Process' type which may lack 'cwd'.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Provide a fallback for process.env if needed by other libraries
      'process.env': env
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
