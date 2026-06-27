import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Grid, TextField,
  Button, Divider, IconButton, Avatar, Checkbox,
  FormControlLabel, Link as MuiLink, Alert, CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

// --- استایل کامپوننت‌ها ---
const LoginPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3, 4),
  marginTop: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

const SocialButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1.2),
}));

// --- تعریف Props ---
interface LoginProps {
  onLogin: (token: string, user?: any) => void;
}

// --- آدرس API بک‌اند ---
// این مقدار بهتر است از فایل تنظیمات یا متغیرهای محیطی خوانده شود
const BACKEND_API_URL = 'http://localhost:5000/api';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const logoPath = '/logo.jpg';

  // --- تنظیمات Axios در زمان بارگذاری کامپوننت ---
  useEffect(() => {
    // تنظیم هدرهای پیش‌فرض برای تمام درخواست‌های Axios
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    
    // تنظیم تایم‌اوت برای جلوگیری از انتظار طولانی
    axios.defaults.timeout = 10000; // 10 ثانیه
    
    console.log('Login component: Axios headers set');
    
    // پاکسازی در زمان خروج از کامپوننت
    return () => {
      console.log('Login component: Cleaning up');
    };
  }, []);

  // --- هندلرهای فرم ---
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (emailError) setEmailError('');
  };
  
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    if (passwordError) setPasswordError('');
  };
  
  const handleRememberMeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(event.target.checked);
  };

  // --- اعتبارسنجی فرم ---
  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    
    if (!email) { 
      setEmailError('Email is required'); 
      isValid = false; 
    } else if (!/\S+@\S+\.\S+/.test(email)) { 
      setEmailError('Email is invalid'); 
      isValid = false; 
    }
    
    if (!password) { 
      setPasswordError('Password is required'); 
      isValid = false; 
    }
    
    return isValid;
  };

  // --- ارسال فرم ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Sending login request to:', `${BACKEND_API_URL}/auth/login`);
      
      // استفاده از axios با تنظیمات بیشتر
      const response = await axios({
        method: 'post',
        url: `${BACKEND_API_URL}/auth/login`,
        data: { 
          email: email.trim(), 
          password 
        },
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: false // تغییر به true اگر از کوکی‌ها استفاده می‌کنید
      });
      
      console.log('Login response received:', { status: response.status, hasToken: !!response.data?.token });
      
      const { token, user } = response.data;
      
      if (token) {
        console.log('Login successful, calling onLogin');
        onLogin(token, user);
      } else {
        console.error('Login response missing token');
        setErrorMessage('Login successful, but no token received.');
      }
    } catch (err: any) {
      console.error("Login API error:", err);
      
      // استخراج پیام خطا از پاسخ API یا خطای Axios
      let errorMsg = 'Login failed. Please try again.';
      
      if (err.response) {
        console.error('Error response data:', err.response.data);
        errorMsg = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        console.error('Error request (no response):', err.request);
        errorMsg = 'No response from server. Please check your connection.';
      } else {
        console.error('Error message:', err.message);
        errorMsg = err.message || errorMsg;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- هندلرهای لاگین اجتماعی ---
  const handleGoogleLogin = () => { alert('Google login not implemented.'); };
  const handleLinkedInLogin = () => { alert('LinkedIn login not implemented.'); };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button component={Link} to="/" startIcon={<ArrowBackIcon />} sx={{textTransform:'none'}}> Back </Button>
            <Typography component="h1" variant="h5"> Sign In </Typography>
            <Box sx={{ width: 80 }} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img src={logoPath} alt="Cool-Assist Logo" style={{ maxWidth: '150px', height: 'auto' }} />
        </Box>

        <LoginPaper elevation={3}>
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                <LockOutlinedIcon />
            </Avatar>

            {errorMessage && (
                <Alert 
                  severity="error" 
                  sx={{ width: '100%', mb: 2 }} 
                  onClose={() => setErrorMessage(null)}
                >
                    {errorMessage}
                </Alert>
            )}

            <SocialButton 
              fullWidth 
              variant="outlined" 
              startIcon={<GoogleIcon />} 
              onClick={handleGoogleLogin} 
              disabled={loading}
            > 
              Continue with Google 
            </SocialButton>
            
            <SocialButton 
              fullWidth 
              variant="outlined" 
              startIcon={<LinkedInIcon />} 
              onClick={handleLinkedInLogin} 
              disabled={loading}
            > 
              Continue with LinkedIn 
            </SocialButton>

            <Divider sx={{ width: '100%', my: 2 }}> OR </Divider>

            <Box 
              component="form" 
              noValidate 
              onSubmit={handleSubmit} 
              sx={{ mt: 0, width: '100%' }}
            >
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={handleEmailChange}
                    error={!!emailError}
                    helperText={emailError}
                    disabled={loading}
                    size="small"
                />
                
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={handlePasswordChange}
                    error={!!passwordError}
                    helperText={passwordError}
                    disabled={loading}
                    size="small"
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <FormControlLabel
                        control={<Checkbox size="small" value="remember" color="primary" checked={rememberMe} onChange={handleRememberMeChange} disabled={loading}/>}
                        label={<Typography variant="body2">Remember me</Typography>}
                    />
                     <MuiLink href="#" variant="body2"> Forgot password? </MuiLink>
                </Box>
                
                <Button 
                  type="submit" 
                  fullWidth 
                  variant="contained" 
                  sx={{ mt: 2, mb: 2 }} 
                  disabled={loading}
                >
                    {loading ? <CircularProgress size={24} color="inherit"/> : "Sign In"}
                </Button>
                
                <Grid container justifyContent="center">
                    <Grid item>
                        <MuiLink component={Link} to="/register" variant="body2">
                            Don't have an account? Sign Up
                        </MuiLink>
                    </Grid>
                </Grid>
            </Box>
        </LoginPaper>
    </Container>
  );
};

export default Login;