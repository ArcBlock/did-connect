import React from 'react';
import { ThemeProvider } from '../src';

export const parameters = {
  options: {
    isFullscreen: false,
    showNav: true,
    showPanel: true,
    panelPosition: 'bottom',
    sortStoriesByKind: false,
    sidebarAnimations: true,
    isToolshown: true,
    selectedPanel: 'storysource',
    storySort: {
      order: ['Introduction', ['Connect', 'SessionManager'], ['Address', 'Avatar', 'Button', 'Logo']],
    },
  },
  backgrounds: {
    values: [
      { name: 'light', value: '#f8f8f7', default: true },
      { name: 'dark', value: '#222222' },
    ],
  },
  controls: { hideNoControlsWarning: true },
};

// - 为每一个 story 包裹 ThemeProvider
// - <StoryFn /> 解决在 story 中使用 useTheme 的问题
export const decorators = [
  (StoryFn) => (
    <ThemeProvider>
      <StoryFn />
    </ThemeProvider>
  ),
];
