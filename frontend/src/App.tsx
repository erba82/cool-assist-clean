import React, { useState, useMemo, createContext, useContext, ReactNode, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, Theme, PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import axios from 'axios';

// Dashboard shell and feature pages are loaded only for their matching routes.
// Dashboard shell is used by every authenticated route; import it eagerly so routes have a single lazy boundary.
import DashboardLayout from './pages/DashboardLayout';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Welcome = lazy(() => import('./pages/Welcome'));
const Overview = lazy(() => import('./pages/Overview'));
const ProjectManagement = lazy(() => import('./pages/ProjectManagement'));
const RefrigerantProperties = lazy(() => import('./pages/RefrigerantProperties'));
const EngineeringCalculator = lazy(() => import('./pages/EngineeringCalculator'));
const UnitConverter = lazy(() => import('./pages/UnitConverter'));
const LoadCalculation = lazy(() => import('./pages/LoadCalculation'));
const Profile = lazy(() => import('./pages/Profile'));
const FinancialAccount = lazy(() => import('./pages/FinancialAccount'));
const SubscriptionPlans = lazy(() => import('./pages/SubscriptionPlans'));
const DiagramGenerator = lazy(() => import('./pages/DiagramGenerator'));
const DiagramViewerPage = lazy(() => import('./pages/DiagramViewerPage'));
const EnhancedDiagramGenerator = lazy(() => import('./pages/EnhancedDiagramGenerator'));
const AutomaticDiagramGenerator = lazy(() => import('./pages/AutomaticDiagramGenerator'));
const AmmoniaCalculationTest = lazy(() => import('./pages/AmmoniaCalculationTest'));
const PLCDesign = lazy(() => import('./pages/PLCDesign'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const AnimatedWelcome = lazy(() => import('./pages/AnimatedWelcome'));
const UnifiedChatPage = lazy(() => import('./components/UnifiedChatPage'));
const AmmoniaDesignWizard = lazy(() => import('./pages/AmmoniaDesignWizard'));
const WiringDiagramPage = lazy(() => import('./pages/WiringDiagramPage'));
const RouteFallback = () => <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading application module…</div>;

// Context and providers
import { AIProvider } from './context/AIContext';
import { LayoutProvider } from './context/LayoutContext';
import { ProjectProvider } from './contexts/ProjectContext';

// تعریف یک نوع برای window با _env_ تعریف شده
declare global {
  interface Window {
    _env_?: {
      REACT_APP_API_BASE_URL?: string;
      // سایر متغیرهای محیطی مورد نیاز
    };
  }
}

// API Base URL - Use relative path to leverage Webpack Proxy
const API_BASE_URL = '';

// Theme context
interface ThemeModeContextProps {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextProps>({
  mode: 'light',
  toggleColorMode: () => { }
});

export const useThemeMode = () => useContext(ThemeModeContext);

// Protected Route component
interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // TEMPORARY: Authentication disabled for development/testing
  // TODO: Re-enable authentication by uncommenting the lines below
  // const isAuthenticated = localStorage.getItem('user') !== null;
  // return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;

  // Bypass authentication - always allow access
  return <>{children}</>;
};

function App() {
  const [mode, setMode] = useState<PaletteMode>('light');
  const [loading, setLoading] = useState<boolean>(true);

  // Theme mode toggle function
  const themeModeValue = useMemo(() => ({
    mode,
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    }
  }), [mode]);

  // Create minimal modern theme
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#0a0a0a' : '#ffffff',
        light: mode === 'light' ? '#333333' : '#e0e0e0',
        dark: mode === 'light' ? '#000000' : '#cccccc',
        contrastText: mode === 'light' ? '#ffffff' : '#0a0a0a',
      },
      secondary: {
        main: mode === 'light' ? '#6366f1' : '#818cf8',
        light: mode === 'light' ? '#818cf8' : '#a5b4fc',
        dark: mode === 'light' ? '#4f46e5' : '#6366f1',
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#ffffff' : '#0a0a0a',
        paper: mode === 'light' ? '#fafafa' : '#151515',
      },
      text: {
        primary: mode === 'light' ? '#0a0a0a' : '#ffffff',
        secondary: mode === 'light' ? '#666666' : '#999999',
      },
      success: {
        main: '#22c55e',
        light: '#4ade80',
        dark: '#16a34a',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb',
      },
      divider: mode === 'light' ? '#e5e5e5' : '#262626',
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      h1: {
        fontWeight: 700,
        fontSize: '3rem',
        lineHeight: 1.2,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2.25rem',
        lineHeight: 1.3,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.875rem',
        lineHeight: 1.4,
        letterSpacing: '-0.015em',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.5,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '0.938rem',
        lineHeight: 1.6,
        fontWeight: 400,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        fontWeight: 400,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '6px',
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: mode === 'light' ? '#f5f5f5' : '#1a1a1a',
            },
            '&::-webkit-scrollbar-thumb': {
              background: mode === 'light' ? '#d4d4d4' : '#404040',
              borderRadius: '3px',
              '&:hover': {
                background: mode === 'light' ? '#a3a3a3' : '#525252',
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 500,
            fontSize: '0.938rem',
            padding: '9px 20px',
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            backgroundColor: mode === 'light' ? '#0a0a0a' : '#ffffff',
            color: mode === 'light' ? '#ffffff' : '#0a0a0a',
            '&:hover': {
              backgroundColor: mode === 'light' ? '#262626' : '#e0e0e0',
            },
          },
          outlined: {
            borderColor: mode === 'light' ? '#e5e5e5' : '#262626',
            borderWidth: '1px',
            '&:hover': {
              borderColor: mode === 'light' ? '#0a0a0a' : '#ffffff',
              backgroundColor: mode === 'light' ? '#fafafa' : '#151515',
            },
          },
          text: {
            '&:hover': {
              backgroundColor: mode === 'light' ? '#f5f5f5' : '#1a1a1a',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: 'none',
            border: `1px solid ${mode === 'light' ? '#e5e5e5' : '#262626'}`,
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: 'none',
          },
          elevation2: {
            boxShadow: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: 'none',
            border: `1px solid ${mode === 'light' ? '#e5e5e5' : '#262626'}`,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: mode === 'light' ? '#d4d4d4' : '#404040',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: mode === 'light' ? '#e5e5e5' : '#262626',
              },
              '&:hover fieldset': {
                borderColor: mode === 'light' ? '#d4d4d4' : '#404040',
              },
              '&.Mui-focused fieldset': {
                borderColor: mode === 'light' ? '#0a0a0a' : '#ffffff',
                borderWidth: '1px',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.813rem',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'light' ? '#e5e5e5' : '#262626'}`,
            backgroundColor: mode === 'light' ? '#ffffff' : '#0a0a0a',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: mode === 'light' ? '#e5e5e5' : '#262626',
          },
        },
      },
    },
  }), [mode]);

  // Demo authentication functions
  const handleLogin = () => {
    // Set demo user in localStorage for consistency
    localStorage.setItem('user', JSON.stringify({ username: 'demo_user', email: 'demo@example.com' }));
    localStorage.setItem('authToken', 'demo-token');
    window.location.href = '/dashboard';
  };

  const handleRegister = (token: string, user?: any) => {
    localStorage.setItem('authToken', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Configure axios defaults - add auth token to requests
  axios.defaults.baseURL = API_BASE_URL;
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Simulate splash screen
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);


  return (
    <Router> {/* تنها Router موجود در برنامه */}
      <ThemeModeContext.Provider value={themeModeValue}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AIProvider>
            <ProjectProvider>
              <LayoutProvider>
                <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Public routes - redirect login to dashboard */}
                  <Route path="/" element={<AnimatedWelcome onComplete={() => window.location.href = '/welcome'} />} />
                  <Route path="/welcome" element={<Welcome />} />
                  <Route path="/login" element={<Navigate to="/dashboard" />} />
                  <Route path="/register" element={<Navigate to="/dashboard" />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />

                  {/* Protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <Overview />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <UnifiedChatPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat/:projectId"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <UnifiedChatPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/project-management"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <ProjectManagement />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/refrigerant-properties"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <RefrigerantProperties />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calculator"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <EngineeringCalculator />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/unit-converter"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <UnitConverter />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/load-calculation"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <LoadCalculation />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <Profile />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/financial-account"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <FinancialAccount />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/plans"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <SubscriptionPlans />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/diagram-generator"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <DiagramGenerator />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/enhanced-diagram-generator"
                    element={
                      <ProtectedRoute>
                        <EnhancedDiagramGenerator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/diagram-viewer"
                    element={
                      <ProtectedRoute>
                        <DiagramViewerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/plc-design"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <PLCDesign />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/auto-diagram-generator"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <AutomaticDiagramGenerator />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />



                  <Route
                    path="/ammonia-test"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <AmmoniaCalculationTest />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />


                  {/* Add Wiring Diagram Route */}
                  <Route
                    path="/wiring-diagram"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout onLogout={handleLogout}>
                          <WiringDiagramPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                </Suspense>
              </LayoutProvider>
            </ProjectProvider>
          </AIProvider>
        </ThemeProvider>
      </ThemeModeContext.Provider>
    </Router>
  );
}

export default App;