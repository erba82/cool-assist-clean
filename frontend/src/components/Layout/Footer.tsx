import React from 'react';
import { Box, Container, Grid, Typography, Link, Divider, useTheme, useMediaQuery } from '@mui/material';
import SocialIcons from '../social/SocialIcons';
import { Link as RouterLink } from 'react-router-dom';

type SocialPlatform = 'instagram' | 'telegram' | 'twitter' | 'linkedin';

const Footer: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const socialPlatforms = [
    { platform: 'instagram' as SocialPlatform, url: 'https://instagram.com/cool-assist' },
    { platform: 'telegram' as SocialPlatform, url: 'https://t.me/cool-assist' },
    { platform: 'twitter' as SocialPlatform, url: 'https://twitter.com/cool-assist' },
    { platform: 'linkedin' as SocialPlatform, url: 'https://linkedin.com/company/cool-assist' }
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        py: 6,
        px: 2,
        mt: 'auto',
        borderTop: `1px solid ${theme.palette.divider}`
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              کول اسیست
            </Typography>
            <Typography variant="body2" color="text.secondary">
              دستیار هوشمند متخصصان HVAC و برق با کمک هوش مصنوعی
            </Typography>
            <Box mt={2}>
              <SocialIcons platforms={socialPlatforms} />
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={4} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              سرویس‌ها
            </Typography>
            <nav>
              <Link variant="body2" component={RouterLink} to="/chat" color="text.secondary" display="block" sx={{ mb: 1 }}>
                چت هوشمند
              </Link>
              <Link variant="body2" component={RouterLink} to="/diagram-generator" color="text.secondary" display="block" sx={{ mb: 1 }}>
                تولید دیاگرام
              </Link>
              <Link variant="body2" component={RouterLink} to="/load-calculation" color="text.secondary" display="block" sx={{ mb: 1 }}>
                محاسبات بار
              </Link>
              <Link variant="body2" component={RouterLink} to="/plc-design" color="text.secondary" display="block" sx={{ mb: 1 }}>
                طراحی PLC
              </Link>
            </nav>
          </Grid>
          
          <Grid item xs={6} sm={4} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              پشتیبانی
            </Typography>
            <nav>
              <Link variant="body2" component={RouterLink} to="/plans" color="text.secondary" display="block" sx={{ mb: 1 }}>
                پلن‌های اشتراک
              </Link>
              <Link variant="body2" href="mailto:support@cool-assist.ir" color="text.secondary" display="block" sx={{ mb: 1 }}>
                تماس با ما
              </Link>
              <Link variant="body2" component={RouterLink} to="/privacy-policy" color="text.secondary" display="block" sx={{ mb: 1 }}>
                حریم خصوصی
              </Link>
              <Link variant="body2" component={RouterLink} to="/terms-of-service" color="text.secondary" display="block" sx={{ mb: 1 }}>
                شرایط استفاده
              </Link>
            </nav>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4 }} />
        
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-start' }}>
          <Typography variant="body2" color="text.secondary" align={isMobile ? 'center' : 'left'}>
            © {new Date().getFullYear()} کول اسیست. تمامی حقوق محفوظ است.
          </Typography>
          
          {!isMobile && (
            <Box>
              <Link variant="body2" color="text.secondary" href="#" sx={{ px: 1 }}>
                نقشه سایت
              </Link>
              <Link variant="body2" color="text.secondary" href="#" sx={{ px: 1 }}>
                بلاگ
              </Link>
              <Link variant="body2" color="text.secondary" href="#" sx={{ px: 1 }}>
                سوالات متداول
              </Link>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;