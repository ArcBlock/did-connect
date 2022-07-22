import React from 'react';
import { addParameters } from '@storybook/react';
import { ThemeProvider } from '../src/Theme';

addParameters({
  options: {
    isFullscreen: false,
    showNav: true,
    showPanel: true,
    panelPosition: 'bottom',
    sortStoriesByKind: false,
    sidebarAnimations: true,
    isToolshown: true,
    selectedPanel: 'storysource',
  },
  controls: { hideNoControlsWarning: true },
});

addParameters({
  backgrounds: {
    values: [
      { name: 'light', value: '#f8f8f7', default: true },
      { name: 'dark', value: '#222222' },
    ],
  },
});

// - 为每一个 story 包裹 ThemeProvider
// - <StoryFn /> 解决在 story 中使用 useTheme 的问题
export const decorators = [
  (StoryFn) => (
    <ThemeProvider>
      <StoryFn />
    </ThemeProvider>
  ),
];
