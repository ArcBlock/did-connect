import type { TLocaleCode } from '@did-connect/types';

export interface SimpleProps {
  component?: string;
  size?: number;
  copyable?: boolean;
  children?: React.ReactNode;
  content?: string;
  inline?: boolean;
  prepend?: any;
  append?: any;
  compact?: boolean;
  startChars?: number;
  endChars?: number;
  locale?: TLocaleCode;
}

export interface ResponsiveProps {
  style?: React.CSSProperties;
  className?: string;
  component?: string;
}

export interface DidAddressProps extends SimpleProps, ResponsiveProps {
  responsive?: boolean;
}
