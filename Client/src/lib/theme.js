export const THEME_VALUES = ["light", "dark", "high-contrast"];

export function isTheme(value) {
  return THEME_VALUES.includes(value);
}

export function resolveInitialTheme(stored) {
  return isTheme(stored) ? stored : "dark";
}

export function nextQuickTheme(theme) {
  return theme === "light" ? "dark" : "light";
}
