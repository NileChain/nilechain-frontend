export type AppLocale = 'en' | 'ar';
export type AppTheme = 'light' | 'dark';
export type AppDirection = 'ltr' | 'rtl';

export type TranslationTree = {
  [key: string]: string | TranslationTree;
};
