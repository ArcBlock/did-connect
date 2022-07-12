import React from 'react';
import { addParameters } from '@storybook/react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider } from 'styled-components';
import { create } from '@arcblock/ux/lib/Theme';
import StyledEngineProvider from '@mui/material/StyledEngineProvider';

const muiTheme = create();

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
    // injectFirst 会影响 makeStyles 自定义样式和 mui styles 覆盖问题
    <StyledEngineProvider injectFirst>
      <MuiThemeProvider theme={muiTheme}>
        <ThemeProvider theme={muiTheme}>
          <StoryFn />
        </ThemeProvider>
      </MuiThemeProvider>
    </StyledEngineProvider>
  ),
];
