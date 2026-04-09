export type ThemeOption = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'repoSphereAppearanceTheme';
export const FONT_STORAGE_KEY = 'repoSphereAppearanceFontSize';
export const DEFAULT_FONT_SIZE = 17;
export const MIN_FONT_SIZE = 14;
export const MAX_FONT_SIZE = 22;

export const clampFontSize = (size: number) =>
  Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size));

export const getSystemTheme = (): Exclude<ThemeOption, 'system'> => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

export const applyTheme = (theme: ThemeOption) => {
  const activeTheme = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.setAttribute('data-theme', activeTheme);
  document.documentElement.style.colorScheme = activeTheme;
  document.body.classList.remove('light-theme', 'dark-theme');
  document.body.classList.add(`${activeTheme}-theme`);
};

export const applyFontSize = (size: number) => {
  const clamped = clampFontSize(size);
  document.documentElement.style.fontSize = `${clamped}px`;
  document.documentElement.style.setProperty('--app-base-font-size', `${clamped}px`);
  document.documentElement.style.setProperty('--app-font-scale', `${clamped / 16}`);
};

export const getStoredAppearance = () => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeOption | null;
  const storedFontSize = localStorage.getItem(FONT_STORAGE_KEY);

  const theme =
    storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
      ? storedTheme
      : 'system';

  const parsedFontSize = Number(storedFontSize);
  const fontSize = Number.isNaN(parsedFontSize)
    ? DEFAULT_FONT_SIZE
    : clampFontSize(parsedFontSize);

  return { theme, fontSize };
};

export const initializeAppearance = () => {
  const { theme, fontSize } = getStoredAppearance();
  applyTheme(theme);
  applyFontSize(fontSize);
  return { theme, fontSize };
};