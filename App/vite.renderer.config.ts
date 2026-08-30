import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig(async () => {
  // @tailwindcss/vite is ESM-only; load it dynamically since this config is CJS.
  const { default: tailwindcss } = await import('@tailwindcss/vite');
  return {
    plugins: [tailwindcss()],
  };
});
