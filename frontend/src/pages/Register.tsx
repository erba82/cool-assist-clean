import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Grid, TextField,
  Button, Divider, Avatar, Checkbox,
  FormControlLabel, Link as MuiLink, Alert, CircularProgress, IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GoogleIcon from '@mui/icons-material/Google';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

// --- استایل کامپوننت‌ها ---
const RegisterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3, 4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '450px',
  margin: 'auto',
  borderRadius: '12px',
  boxShadow: theme.palette.mode === 'light' 
    ? '0px 6px 16px rgba(0, 0, 0, 0.05)' 
    : '0px 6px 16px rgba(0, 0, 0, 0.3)',
}));

const SocialButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1.2),
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'light' 
      ? '0px 4px 8px rgba(0,0,0,0.1)' 
      : '0px 4px 8px rgba(0,0,0,0.3)',
  }
}));

// --- تعریف Props ---
interface RegisterProps {
  onRegister: (token: string, user?: any) => void;
}

// --- آدرس API بک‌اند ---
// این مقدار بهتر است از فایل تنظیمات یا متغیرهای محیطی خوانده شود
const BACKEND_API_URL = 'http://localhost:5000/api';

// --- کامپوننت Register ---
const Register: React.FC<RegisterProps> = ({ onRegister }) => {
    // --- state ها ---
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
    const [agreePrivacy, setAgreePrivacy] = useState<boolean>(false);
    
    // --- خطاهای اعتبارسنجی ---
    const [nameError, setNameError] = useState<string>('');
    const [emailError, setEmailError] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');
    const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
    const [agreeTermsError, setAgreeTermsError] = useState<string>('');
    const [agreePrivacyError, setAgreePrivacyError] = useState<string>('');
    
    // --- سایر state ها ---
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate();
    const logoPath = '/logo.jpg';

    // --- تنظیمات Axios در زمان بارگذاری کامپوننت ---
    useEffect(() => {
        // تنظیم هدرهای پیش‌فرض برای تمام درخواست‌های Axios
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        
        // تنظیم تایم‌اوت برای جلوگیری از انتظار طولانی
        axios.defaults.timeout = 10000; // 10 ثانیه
        
        console.log('Register component: Axios headers set');
        
        // پاکسازی در زمان خروج از کامپوننت
        return () => {
            console.log('Register component: Cleaning up');
        };
    }, []);

    // --- هندلرهای تغییر فرم ---
    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
        setName(event.target.value); 
        setNameError(''); 
    };
    
    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
        setEmail(event.target.value.trim()); 
        setEmailError(''); 
    };
    
    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
        setPassword(event.target.value); 
        setPasswordError(''); 
        if(event.target.value && event.target.value === confirmPassword) 
            setConfirmPasswordError(''); 
    };
    
    const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
        setConfirmPassword(event.target.value); 
        if(password === event.target.value) 
            setConfirmPasswordError(''); 
    };
    
    const handleAgreeTermsChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
        setAgreeTerms(event.target.checked); 
        setAgreeTermsError(''); 
    };

    const handleAgreePrivacyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAgreePrivacy(event.target.checked);
        setAgreePrivacyError('');
    };

    // --- اعتبارسنجی فرم ---
    const validateForm = (): boolean => {
        let isValid = true;
        setNameError(''); 
        setEmailError(''); 
        setPasswordError(''); 
        setConfirmPasswordError(''); 
        setAgreeTermsError('');
        setAgreePrivacyError('');

        if (!name.trim()) { 
            setNameError('Name is required'); 
            isValid = false; 
        }
        
        if (!email) { 
            setEmailError('Email is required'); 
            isValid = false; 
        } else if (!/\S+@\S+\.\S+/.test(email)) { 
            setEmailError('Email address is invalid'); 
            isValid = false; 
        }
        
        if (!password) { 
            setPasswordError('Password is required'); 
            isValid = false; 
        } else if (password.length < 6) { 
            setPasswordError('Password must be at least 6 characters'); 
            isValid = false; 
        }
        
        if (!confirmPassword) { 
            setConfirmPasswordError('Please confirm your password'); 
            isValid = false; 
        } else if (password !== confirmPassword) { 
            setConfirmPasswordError('Passwords do not match'); 
            isValid = false; 
        }
        
        if (!agreeTerms) { 
            setAgreeTermsError('You must agree to the Terms of Service'); 
            isValid = false; 
        }

        if (!agreePrivacy) {
            setAgreePrivacyError('You must agree to the Privacy Policy');
            isValid = false;
        }

        return isValid;
    };

    // --- ارسال فرم ---
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        setErrorMessage(null);

        // اعتبارسنجی
        if (!validateForm()) {
            console.log("Form validation failed.");
            return;
        }

        setLoading(true);
        
        try {
            console.log('Sending registration request to:', `${BACKEND_API_URL}/auth/register`);
            console.log('Registration data:', { 
                name: name.trim(), 
                email: email.trim().toLowerCase(),
                password: '[MASKED]',
                agreeTerms,
                agreePrivacy
            });
            
            // استفاده از axios با تنظیمات بیشتر
            const response = await axios({
                method: 'post',
                url: `${BACKEND_API_URL}/auth/register`,
                data: {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    agreeTerms,
                    agreePrivacy
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: false, // تغییر به true اگر از کوکی‌ها استفاده می‌کنید
                timeout: 15000 // افزایش تایم‌اوت برای ثبت‌نام
            });

            console.log("Register API Response Status:", response.status);
            console.log("Register API Response has token:", !!response.data?.token);

            // استخراج توکن و اطلاعات کاربر از پاسخ
            const { token, user } = response.data;
            
            if (token) {
                console.log('Registration successful, calling onRegister with token');
                // فراخوانی تابع onRegister که از App.tsx پاس داده شده
                onRegister(token, user);
            } else {
                console.error('Registration response is missing token');
                // اگر به هر دلیلی توکن در پاسخ نبود
                setErrorMessage('Registration successful, but failed to log in automatically.');
            }
        } catch (err: any) {
            console.error("Register API error:", err);
            
            // استخراج پیام خطا از پاسخ API یا خطای Axios
            let errorMsg = 'Registration failed. Please try again.';
            
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

    // --- هندلرهای ثبت‌نام اجتماعی ---
    const handleGoogleSignup = () => { alert('Google signup is not implemented yet.'); };
    const handleLinkedInSignup = () => { alert('LinkedIn signup is not implemented yet.'); };

    // --- ساختار JSX ---
    return (
      <Container maxWidth="xs" sx={{ mt: 2, mb: 4 }}>
          {/* دکمه بازگشت */}
          <Button 
            component={Link} 
            to="/" 
            startIcon={<ArrowBackIcon />} 
            sx={{ mb: 2, textTransform:'none' }}
          >
              Back to Welcome
          </Button>

          <RegisterPaper elevation={3}>
            <Avatar sx={{ 
                m: 1, 
                bgcolor: 'primary.main',
                boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                width: 48,
                height: 48
            }}>
                <PersonAddIcon />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Create Account
            </Typography>

            {/* نمایش خطای API */}
            {errorMessage && (
                <Alert 
                  severity="error" 
                  sx={{ width: '100%', mb: 2, borderRadius: '8px' }} 
                  onClose={() => setErrorMessage(null)}
                  action={
                    <IconButton
                      aria-label="close"
                      color="inherit"
                      size="small"
                      onClick={() => setErrorMessage(null)}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  }
                >
                    {errorMessage}
                </Alert>
            )}

            {/* دکمه های ثبت نام اجتماعی */}
             <SocialButton 
               fullWidth 
               variant="outlined" 
               startIcon={<GoogleIcon />} 
               onClick={handleGoogleSignup} 
               disabled={loading}
             > 
               Sign up with Google 
             </SocialButton>
             
             <SocialButton 
               fullWidth 
               variant="outlined" 
               startIcon={<LinkedInIcon />} 
               onClick={handleLinkedInSignup} 
               disabled={loading}
             > 
               Sign up with LinkedIn 
             </SocialButton>

            <Divider sx={{ width: '100%', my: 2 }}>
                <Typography variant="body2" color="text.secondary"> OR </Typography>
            </Divider>

            {/* فرم ثبت نام */}
            <Box 
              component="form" 
              noValidate 
              onSubmit={handleSubmit} 
              sx={{ mt: 1, width: '100%' }}
            >
              <TextField 
                size="small" 
                margin="dense" 
                required 
                fullWidth 
                id="name" 
                label="Full Name" 
                name="name" 
                autoComplete="name" 
                autoFocus 
                value={name} 
                onChange={handleNameChange} 
                error={!!nameError} 
                helperText={nameError} 
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
              
              <TextField 
                size="small" 
                margin="dense" 
                required 
                fullWidth 
                id="email" 
                label="Email Address" 
                name="email" 
                autoComplete="email" 
                value={email} 
                onChange={handleEmailChange} 
                error={!!emailError} 
                helperText={emailError} 
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
              
              <TextField 
                size="small" 
                margin="dense" 
                required 
                fullWidth 
                name="password" 
                label="Password (min. 6 chars)" 
                type="password" 
                id="password" 
                value={password} 
                onChange={handlePasswordChange} 
                error={!!passwordError} 
                helperText={passwordError} 
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
              
              <TextField 
                size="small" 
                margin="dense" 
                required 
                fullWidth 
                name="confirmPassword" 
                label="Confirm Password" 
                type="password" 
                id="confirmPassword" 
                value={confirmPassword} 
                onChange={handleConfirmPasswordChange} 
                error={!!confirmPasswordError} 
                helperText={confirmPasswordError} 
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
              
              {/* چک باکس شرایط استفاده */}
              <FormControlLabel
                control={
                  <Checkbox 
                    size="small" 
                    value="agreeTerms" 
                    color="primary" 
                    checked={agreeTerms} 
                    onChange={handleAgreeTermsChange} 
                    disabled={loading}
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the <MuiLink component={Link} to="/terms-of-service" target="_blank" variant="body2">Terms of Service</MuiLink>
                  </Typography>
                }
                sx={{ mt: 1 }}
              />
              
              {/* نمایش خطای Terms زیر چک باکس */}
              {agreeTermsError && ( 
                <Typography 
                  color="error" 
                  variant="caption" 
                  display="block" 
                  sx={{ mt: -1, mb: 1, ml: 1.5 }}
                > 
                  {agreeTermsError} 
                </Typography> 
              )}

              {/* چک باکس حریم خصوصی */}
              <FormControlLabel
                control={
                  <Checkbox 
                    size="small" 
                    value="agreePrivacy" 
                    color="primary" 
                    checked={agreePrivacy} 
                    onChange={handleAgreePrivacyChange} 
                    disabled={loading}
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the <MuiLink component={Link} to="/privacy-policy" target="_blank" variant="body2">Privacy Policy</MuiLink>
                  </Typography>
                }
                sx={{ mt: 0 }}
              />

              {/* نمایش خطای Privacy زیر چک باکس */}
              {agreePrivacyError && ( 
                <Typography 
                  color="error" 
                  variant="caption" 
                  display="block" 
                  sx={{ mt: -1, mb: 1, ml: 1.5 }}
                > 
                  {agreePrivacyError} 
                </Typography> 
              )}
              
              {/* دکمه ثبت نام */}
              <Button 
                type="submit" 
                fullWidth 
                variant="contained" 
                sx={{ 
                  mt: 2, 
                  mb: 2,
                  py: 1,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: '0px 3px 5px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0px 6px 10px rgba(0,0,0,0.15)',
                  }
                }} 
                disabled={loading}
              >
                  {loading ? <CircularProgress size={24} color="inherit"/> : "Sign Up"}
              </Button>
              
              {/* لینک ورود */}
              <Grid container justifyContent="flex-end">
                <Grid item>
                    <MuiLink component={Link} to="/login" variant="body2">
                        Already have an account? Sign in
                    </MuiLink>
                </Grid>
              </Grid>
            </Box>
          </RegisterPaper>
      </Container>
    );
};

export default Register;