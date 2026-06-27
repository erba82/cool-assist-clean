// frontend/src/pages/PrivacyPolicy.tsx
import React from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';

const PrivacyPolicy: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, my: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          سیاست حفظ حریم خصوصی
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" paragraph>
            ما در کول اسیست متعهد به حفظ حریم خصوصی و اطلاعات شخصی کاربران هستیم. این سیاست حریم خصوصی توضیح می‌دهد که ما چگونه اطلاعات شما را جمع‌آوری، استفاده و محافظت می‌کنیم.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            ۱. اطلاعاتی که جمع‌آوری می‌کنیم
          </Typography>
          <Typography variant="body1" paragraph>
            اطلاعاتی که ما جمع‌آوری می‌کنیم شامل موارد زیر است:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1">
                اطلاعات شخصی: نام، نشانی ایمیل، شماره تلفن و سایر اطلاعات تماس که هنگام ثبت‌نام ارائه می‌دهید.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                اطلاعات حساب: اطلاعات مربوط به اشتراک، سوابق پرداخت و تراکنش‌های شما.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                اطلاعات استفاده: نحوه استفاده شما از خدمات ما، از جمله تعامل با نرم‌افزار و پرس‌وجوهای هوش مصنوعی.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                اطلاعات دستگاه: اطلاعات مربوط به دستگاه‌هایی که برای دسترسی به خدمات ما استفاده می‌کنید.
              </Typography>
            </li>
          </ul>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            ۲. نحوه استفاده از اطلاعات شما
          </Typography>
          <Typography variant="body1" paragraph>
            ما از اطلاعات شما برای موارد زیر استفاده می‌کنیم:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1">
                ارائه، نگهداری و بهبود خدمات خود.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                پردازش تراکنش‌ها و مدیریت اشتراک شما.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                برقراری ارتباط با شما در مورد سرویس، به‌روزرسانی‌ها و پیشنهادات.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                حفاظت از امنیت و یکپارچگی سرویس ما.
              </Typography>
            </li>
          </ul>
        </Box>

        {/* ادامه‌ی مطالب سیاست حریم خصوصی */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            ۳. اشتراک‌گذاری اطلاعات
          </Typography>
          <Typography variant="body1" paragraph>
            ما اطلاعات شما را با اشخاص ثالث به اشتراک نمی‌گذاریم، مگر در موارد زیر:
          </Typography>
          {/* جزئیات بیشتر */}
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            ۴. امنیت داده‌ها
          </Typography>
          <Typography variant="body1" paragraph>
            ما از اقدامات امنیتی مناسب برای محافظت از اطلاعات شما در برابر دسترسی، افشا، تغییر یا تخریب غیرمجاز استفاده می‌کنیم.
          </Typography>
          {/* جزئیات بیشتر */}
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            ۵. حقوق شما
          </Typography>
          <Typography variant="body1" paragraph>
            شما حق دارید به اطلاعات شخصی خود دسترسی داشته باشید، آنها را اصلاح کنید یا در برخی موارد درخواست حذف کنید.
          </Typography>
          {/* جزئیات بیشتر */}
        </Box>
        
        <Box>
          <Typography variant="h6" gutterBottom>
            ۶. تغییرات در سیاست حریم خصوصی
          </Typography>
          <Typography variant="body1" paragraph>
            ما ممکن است این سیاست حریم خصوصی را از زمان به زمان به‌روز کنیم. تاریخ آخرین به‌روزرسانی در بالای این صفحه نشان داده می‌شود.
          </Typography>
          {/* جزئیات بیشتر */}
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          آخرین به‌روزرسانی: ۱۰ فروردین ۱۴۰۴
        </Typography>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;