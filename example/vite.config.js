import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Unocss from 'unocss/vite';
import presetUno from '@unocss/preset-uno';
import presetIcons from '@unocss/preset-icons';
import { createBlockletPlugin } from 'vite-plugin-blocklet';

// https://vitejs.dev/config/
const port = process.env.BLOCKLET_PORT || 3000;
export default defineConfig({
  plugins: [
    vue(),
    Unocss({
      presets: [
        presetUno(),
        presetIcons({
          extraProperties: {
            display: 'inline-block',
            'vertical-align': 'middle',
          },
        }),
      ],
    }),
    createBlockletPlugin(),
  ],
  server: {
    port,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3030',
        changeOrigin: false,
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
});
