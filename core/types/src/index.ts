export * from './schemas';
export * from './types';

export type I18nMessages = {
  [key: string]: {
    [key: string]: string;
  };
};

export type AnyObject = {
  [key: string]: any;
};

export class CustomError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    // @ts-ignore
    if (typeof Error.captureStackTrace === 'function') {
      // @ts-ignore
      Error.captureStackTrace(this, CustomError);
    }
    this.code = code;
  }
}
