import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CircularProgress } from '@mui/material';

interface AdBannerProps {
  adClient: string;
  adSlot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  responsive?: boolean;
  style?: React.CSSProperties;
  id?: string; // اضافه کردن شناسه منحصر به فرد
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const AdBanner: React.FC<AdBannerProps> = ({
  adClient,
  adSlot,
  format = 'auto',
  responsive = true,
  style,
  id = `ad-${Math.random().toString(36).substr(2, 9)}` // شناسه تصادفی
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    // بارگذاری اسکریپت گوگل ادز اگر وجود نداشته باشد
    const loadAdScript = () => {
      if (!document.querySelector('script[src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = initAd;
        script.onerror = () => setAdFailed(true);
        document.head.appendChild(script);
      } else {
        // اگر اسکریپت قبلاً بارگذاری شده
        initAd();
      }
    };

    // راه‌اندازی تبلیغ
    const initAd = () => {
      if (!adRef.current) return;
      
      try {
        if (window.adsbygoogle) {
          // اطمینان از اینکه این جزء در window.adsbygoogle وجود ندارد
          // اضافه کردن تبلیغ جدید
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          
          // بررسی وضعیت بارگذاری تبلیغ بعد از 2 ثانیه
          setTimeout(() => {
            if (adRef.current && adRef.current.querySelector('iframe')) {
              setAdLoaded(true);
            } else {
              setAdFailed(true);
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Error initializing Google Ads:', error);
        setAdFailed(true);
      }
    };

    // بارگذاری تبلیغات با تأخیر کوتاه
    const timeoutId = setTimeout(() => {
      loadAdScript();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // نشان دهنده بارگذاری
  if (!adLoaded && !adFailed) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          my: 2,
          width: '100%',
          minHeight: '100px',
          bgcolor: 'background.paper',
          borderRadius: 1,
          ...style
        }}
      >
        <CircularProgress size={20} />
      </Box>
    );
  }

  // نمایش خطا در صورت شکست بارگذاری در محیط توسعه
  if (adFailed && process.env.NODE_ENV === 'development') {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          my: 2,
          width: '100%',
          minHeight: '100px',
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px dashed #ccc',
          ...style
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Ad failed to load
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      ref={adRef}
      sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        my: 2,
        width: '100%',
        minHeight: adFailed ? '0px' : '100px',
        overflow: 'hidden',
        ...style
      }}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: responsive ? '100%' : '',
          height: responsive ? 'auto' : '',
          ...style
        }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        data-ad-test="on" // برای محیط توسعه
        id={id} // شناسه منحصربه‌فرد
      />
    </Box>
  );
};

// کامپوننت محل تبلیغات داخلی
export const InternalAdSpace: React.FC<{
  id: string;
  width?: number | string;
  height?: number | string;
}> = ({ id, width = '100%', height = 'auto' }) => {
  return (
    <Box
      sx={{
        border: '1px dashed #ccc',
        borderRadius: 1,
        p: 2,
        my: 2,
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center">
        Your Ad Here - ID: {id}
      </Typography>
    </Box>
  );
};