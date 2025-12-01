// Dark Mode Storage - Manages dark mode preference

const DARK_MODE_KEY = 'darkMode';

// Get dark mode preference from localStorage
export const getDarkMode = (): boolean => {
  const stored = localStorage.getItem(DARK_MODE_KEY);
  return stored === 'true';
};

// Set dark mode preference
export const setDarkMode = (isDark: boolean): void => {
  localStorage.setItem(DARK_MODE_KEY, String(isDark));
  applyDarkMode(isDark);
  // Trigger event for reactivity
  window.dispatchEvent(new Event('darkModeChanged'));
};

// Apply dark mode to document
export const applyDarkMode = (isDark: boolean): void => {
  if (isDark) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
};

// Initialize dark mode on app load
export const initializeDarkMode = (): void => {
  const isDark = getDarkMode();
  applyDarkMode(isDark);
};
