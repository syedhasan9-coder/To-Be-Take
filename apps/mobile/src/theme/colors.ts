/**
 * To Be Take - Mobile Color Palette & Design Tokens
 * Warm linen, Forest green, Botanical accents
 */
export const colors = {
  // Brand Forest Greens
  forest: {
    900: '#0d1c15',
    800: '#14291f',
    700: '#1b3b2b',
    600: '#234a36',
    500: '#2c5e43',
    400: '#3d7857',
    100: '#eaf5ed',
  },

  // Warm Linen & Neutrals
  linen: {
    50: '#fdfcf9',
    100: '#faf7f0',
    200: '#f5f2eb',
    300: '#eee9dc',
    400: '#e6dfd3',
    500: '#d8cfc0',
  },

  // Gold / Sand Accents
  gold: {
    600: '#a07425',
    500: '#d4a34b',
    400: '#e0b86c',
    100: '#fbf4e6',
  },

  // Text Colors
  text: {
    primary: '#19201c',
    secondary: '#5c6b62',
    muted: '#8c9990',
    inverse: '#ffffff',
    inverseMuted: '#a3b899',
  },

  // Status & Feedback
  status: {
    error: '#dc2626',
    errorLight: '#ef4444',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    errorText: '#991b1b',

    success: '#16a34a',
    successBg: '#eaf5ed',
    successBorder: '#bce0cb',
    successText: '#14291f',

    warning: '#d97706',
    warningBg: '#fffbeb',
    warningBorder: '#fde68a',

    info: '#2563eb',
    infoBg: '#eff6ff',
    infoBorder: '#bfdbfe',
  },

  // Common UI
  card: '#ffffff',
  background: '#f5f2eb',
  border: '#e6dfd3',
  borderFocus: '#14291f',
  inputBg: '#ffffff',
} as const;
