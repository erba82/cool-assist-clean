// frontend/src/pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Avatar, Grid, Paper, Divider, Tabs, Tab, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Edit as EditIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';

interface ProfileData {
  name: string;
  email: string;
  bio: string;
  avatar: string;
  company?: string;
  phone?: string;
  profession?: string;
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    theme: string;
  };
  subscription?: {
    plan: string;
    status: string;
    expiresAt: string;
  };
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [tabValue, setTabValue] = useState(0);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      showNotification('خطا در بارگیری پروفایل', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      await axios.put('/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(prev => ({ ...prev, ...formData } as ProfileData));
      setEditing(false);
      showNotification('پروفایل با موفقیت به‌روزرسانی شد', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('خطا در به‌روزرسانی پروفایل', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setShowMessage(true);
  };

  if (loading && !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
              src={profile?.avatar}
              sx={{ width: 120, height: 120, mb: 2 }}
            />
            {editing && (
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                size="small"
                sx={{ mt: 1 }}
              >
                تغییر تصویر
              </Button>
            )}
          </Grid>
          <Grid item xs={12} md={9}>
            {editing ? (
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="نام"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="ایمیل"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="شرکت"
                      name="company"
                      value={formData.company || ''}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="تلفن"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="درباره من"
                      name="bio"
                      multiline
                      rows={3}
                      value={formData.bio || ''}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={() => setEditing(false)}
                      >
                        انصراف
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                      >
                        ذخیره تغییرات
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h5" component="h1" fontWeight="bold">
                    {profile?.name}
                  </Typography>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => setEditing(true)}
                  >
                    ویرایش
                  </Button>
                </Box>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {profile?.email}
                </Typography>
                {profile?.phone && (
                  <Typography variant="body2" gutterBottom>
                    تلفن: {profile.phone}
                  </Typography>
                )}
                {profile?.company && (
                  <Typography variant="body2" gutterBottom>
                    شرکت: {profile.company}
                  </Typography>
                )}
                <Divider sx={{ my: 2 }} />
                {profile?.bio && (
                  <Typography variant="body1">
                    {profile.bio}
                  </Typography>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
          <Tab label="اشتراک" />
          <Tab label="تنظیمات" />
          <Tab label="فعالیت‌ها" />
        </Tabs>
        
        <Box sx={{ mt: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>وضعیت اشتراک</Typography>
              {profile?.subscription ? (
                <Box>
                  <Typography variant="body1">
                    پلن: <strong>{profile.subscription.plan}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    وضعیت: {profile.subscription.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    تاریخ انقضا: {new Date(profile.subscription.expiresAt).toLocaleDateString('fa-IR')}
                  </Typography>
                  <Button variant="contained" color="primary" sx={{ mt: 2 }}>
                    ارتقا اشتراک
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    شما در حال حاضر اشتراک فعالی ندارید.
                  </Typography>
                  <Button variant="contained" color="primary">
                    خرید اشتراک
                  </Button>
                </Box>
              )}
            </Box>
          )}
          
          {tabValue === 1 && (
            <Typography variant="body1">
              بخش تنظیمات کاربر
            </Typography>
          )}
          
          {tabValue === 2 && (
            <Typography variant="body1">
              تاریخچه فعالیت‌های کاربر
            </Typography>
          )}
        </Box>
      </Paper>

      <Snackbar 
        open={showMessage} 
        autoHideDuration={6000} 
        onClose={() => setShowMessage(false)}
      >
        <Alert 
          severity={message.type as 'success' | 'error'} 
          onClose={() => setShowMessage(false)}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;