// src/theme.js
import { createTheme } from '@mui/material/styles';

// Create a global theme with a custom font family
const theme = createTheme({
  typography: {
    fontFamily: '"Courier New", Courier, monospace', // Global font family
  },
});

export default theme;
