import React, { useState, useMemo } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';

import Settings from './components/Settings';

const animationStyles = (
  <GlobalStyles styles={`
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `} />
);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '', url: '' });
  const [themeMode, setThemeMode] = useState('light'); // Default to light mode
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' or 'settings'

  const theme = useMemo(
    () => {
      const applePalette = {
        blue: '#007AFF',
        lightGray: '#f5f5f7',
        darkGray: '#1d1d1f',
        white: '#ffffff',
        black: '#000000',
        lightText: '#e8e8e8',
        darkPaper: '#1e1e1e'
      };

      return createTheme({
        palette: {
          mode: themeMode,
          primary: {
            main: applePalette.blue,
          },
          background: {
            default: themeMode === 'light' ? applePalette.lightGray : applePalette.black,
            paper: themeMode === 'light' ? applePalette.white : applePalette.darkPaper,
          },
          text: {
            primary: themeMode === 'light' ? applePalette.darkGray : applePalette.lightText,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: { 
                borderRadius: '999em',
                textTransform: 'none',
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: '999em',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16, // Apply a softer, "superellipse"-like corner
              }
            }
          }
        },
      });
    },
    [themeMode],
  );

  const handleLoginSuccess = (userCredentials) => {
    setCredentials(userCredentials);
    setIsLoggedIn(true);
  };

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    if (!isLoggedIn) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userCredentials={credentials} toggleTheme={toggleTheme} navigateTo={navigateTo} />;
      case 'settings':
        return <Settings navigateTo={navigateTo} />;
      default:
        return <Dashboard userCredentials={credentials} toggleTheme={toggleTheme} navigateTo={navigateTo} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {animationStyles}
      <main>
        {renderPage()}
      </main>
    </ThemeProvider>
  );
}

export default App;
