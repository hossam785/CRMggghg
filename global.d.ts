import type { Messages } from './src/i18n/types';

declare module 'next-intl' {
  interface AppConfig {
    Messages: Messages;
    Locale: 'ar' | 'en';
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
declare interface IntlMessages extends Messages {}
