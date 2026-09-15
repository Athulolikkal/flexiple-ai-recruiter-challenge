import { createTheme } from '@mui/material/styles';

/**
 * A deliberately restrained theme: one accent color, neutral surfaces, no
 * gradients or heavy shadows. The product should read as a serious B2B
 * recruiting tool, not a marketing site.
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1e3a5f', light: '#3a5a80', dark: '#152840' },
    secondary: { main: '#0f766e' },
    background: { default: '#f7f8fa', paper: '#ffffff' },
    text: { primary: '#1a1f2b', secondary: '#5b6472' },
    divider: '#e2e5ea',
    success: { main: '#1b7a4d' },
    warning: { main: '#b5760a' },
    error: { main: '#b3261e' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h2: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.15rem', fontWeight: 600 },
    subtitle1: { fontSize: '0.95rem', color: '#5b6472' },
    body2: { fontSize: '0.875rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { boxShadow: 'none' },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid #e2e5ea',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
  },
});
