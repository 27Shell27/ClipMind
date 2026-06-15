import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // Принудительно используем автоматический JSX-трансформ,
  // иначе в продакшен-сборке возникает ошибка "React is not defined".
  vite: () => ({
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
  }),
  manifest: {
    name: 'ClipMind',
    description: 'Summarize any YouTube video in seconds with AI',
    version: '1.0.0',
    permissions: ['activeTab', 'storage'],
    action: {
      default_popup: 'popup.html',
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png'
      }
    },
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '128': 'icon/128.png'
    }
  }
});
