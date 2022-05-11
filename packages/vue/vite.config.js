import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Unocss from 'unocss/vite';
import presetUno from '@unocss/preset-uno';
import presetIcons from '@unocss/preset-icons';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

import svgLoader from './src/plugins/svg-loader';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    svgLoader({
      defaultImport: 'url', // or 'raw'
      svgo: false,
    }),
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
    cssInjectedByJsPlugin({
      // topExecutionPriority: false,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'build/build-lib.js'),
      name: 'DIDConnect',
      // formats: ['cjs', 'es', 'iife'],
      fileName: (format) => `did-connect.${format}.js`,
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: [
        'vue',
        '@fontsource/ubuntu-mono/400.css',
        // 'naive-ui',
        // 'axios',
      ],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
          // 'naive-ui': 'NaiveUI',
        },
      },
    },
  },
});
