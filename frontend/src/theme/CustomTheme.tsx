import { createTheme, PaletteMode, alpha } from '@mui/material';

// تم پیشرفته با پشتیبانی از حالت روشن/تاریک
export const getCustomTheme = (mode: PaletteMode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#1976d2' : '#90caf9',
      light: mode === 'light' ? '#42a5f5' : '#bbdefb',
      dark: mode === 'light' ? '#0d47a1' : '#64b5f6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: mode === 'light' ? '#f50057' : '#f48fb1',
      light: mode === 'light' ? '#ff4081' : '#f8bbd0',
      dark: mode === 'light' ? '#c51162' : '#bf5f82',
    },
    background: {
      default: mode === 'light' ? '#f5f8fa' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
    text: {
      primary: mode === 'light' ? '#172B4D' : '#e0e0e0',
      secondary: mode === 'light' ? '#5E6C84' : '#a0a0a0',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: '"Vazirmatn", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none', 
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: mode === 'light' ? '#f1f1f1' : '#292929',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'light' ? '#c1c1c1' : '#6b6b6b',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: mode === 'light' ? '#a8a8a8' : '#848484',
          },
        },
      }),
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          boxShadow: mode === 'light' ? '0px 3px 5px rgba(0,0,0,0.1)' : 'none',
          fontWeight: 500,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'light' ? '0px 6px 10px rgba(0,0,0,0.15)' : '0px 6px 10px rgba(0,0,0,0.5)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: mode === 'light' ? '0px 6px 10px rgba(0,0,0,0.15)' : '0px 6px 10px rgba(0,0,0,0.5)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: mode === 'light' 
            ? '0px 6px 16px rgba(0, 0, 0, 0.05)'
            : '0px 6px 16px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: mode === 'light'
              ? '0px 12px 24px rgba(0, 0, 0, 0.1)'
              : '0px 12px 24px rgba(0, 0, 0, 0.6)',
          }
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'light'
            ? '0px 2px 4px rgba(0, 0, 0, 0.05)'
            : '0px 2px 4px rgba(0, 0, 0, 0.2)',
          background: mode === 'light' 
            ? 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)'
            : 'linear-gradient(90deg, #2b2b2b 0%, #3a3a3a 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: mode === 'light'
            ? '0px 2px 8px rgba(0, 0, 0, 0.05)'
            : '0px 2px 8px rgba(0, 0, 0, 0.3)',
        },
        elevation4: {
          boxShadow: mode === 'light'
            ? '0px 4px 16px rgba(0, 0, 0, 0.08)'
            : '0px 4px 16px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: mode === 'light' ? '#f5f5f5' : '#1e1e1e',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: mode === 'light'
              ? '0px 0px 0px 2px rgba(25, 118, 210, 0.05)'
              : '0px 0px 0px 2px rgba(144, 202, 249, 0.05)',
          },
          '&.Mui-focused': {
            boxShadow: mode === 'light'
              ? '0px 0px 0px 3px rgba(25, 118, 210, 0.15)'
              : '0px 0px 0px 3px rgba(144, 202, 249, 0.15)',
          },
        },
        notchedOutline: {
          borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          boxShadow: mode === 'light'
            ? '0px 12px 32px rgba(0, 0, 0, 0.12)'
            : '0px 12px 32px rgba(0, 0, 0, 0.6)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
          margin: 8,
        },
        switchBase: {
          padding: 1,
          '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
              backgroundColor: mode === 'light' ? '#1976d2' : '#90caf9',
              opacity: 1,
              border: 0,
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
        },
        track: {
          borderRadius: 26 / 2,
          backgroundColor: mode === 'light' ? '#E9E9EA' : '#39393D',
          opacity: 1,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: mode === 'light' 
              ? alpha('#1976d2', 0.1) 
              : alpha('#90caf9', 0.15),
            '&:hover': {
              backgroundColor: mode === 'light' 
                ? alpha('#1976d2', 0.15) 
                : alpha('#90caf9', 0.25),
            }
          },
          '&:hover': {
            backgroundColor: mode === 'light' 
              ? alpha('#000000', 0.03) 
              : alpha('#ffffff', 0.03),
          }
        }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'light' ? '#232323' : '#e0e0e0',
          color: mode === 'light' ? '#ffffff' : '#232323',
          fontSize: '0.75rem',
          borderRadius: '4px',
          boxShadow: mode === 'light'
            ? '0px 2px 8px rgba(0, 0, 0, 0.15)'
            : '0px 2px 8px rgba(0, 0, 0, 0.5)',
        }
      }
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' 
            ? 'rgba(0, 0, 0, 0.3)' 
            : 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(3px)'
        }
      }
    }
  },
});