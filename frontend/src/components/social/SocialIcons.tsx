// frontend/src/components/social/SocialIcons.tsx
import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { SxProps, Theme } from '@mui/material/styles';

// آیکون‌ها - از MUI Icons یا یک پکیج مثل react-icons استفاده کنید
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TelegramIcon from '@mui/icons-material/Telegram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'telegram' | 'whatsapp';

interface SocialIconProps {
  platform: SocialPlatform;
  url: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

interface SocialIconsProps {
  platforms: SocialIconProps[];
  direction?: 'row' | 'column';
  spacing?: number;
  sx?: SxProps<Theme>;
}

// کامپوننت تک آیکون
const SocialIcon: React.FC<SocialIconProps> = ({ platform, url, color, size = 'medium' }) => {
  const getIcon = () => {
    switch (platform) {
      case 'twitter':
        return <TwitterIcon />;
      case 'facebook':
        return <FacebookIcon />;
      case 'instagram':
        return <InstagramIcon />;
      case 'linkedin':
        return <LinkedInIcon />;
      case 'telegram':
        return <TelegramIcon />;
      case 'whatsapp':
        return <WhatsAppIcon />;
      default:
        return null;
    }
  };

  return (
    <Tooltip title={platform.charAt(0).toUpperCase() + platform.slice(1)}>
      <IconButton
        component="a"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={platform}
        size={size}
        sx={{ color: color || 'inherit' }}
      >
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
};

// کامپوننت گروه آیکون‌ها
const SocialIcons: React.FC<SocialIconsProps> = ({
  platforms,
  direction = 'row',
  spacing = 1,
  sx = {}
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: direction,
        gap: spacing,
        ...sx
      }}
    >
      {platforms.map((platform, index) => (
        <SocialIcon key={index} {...platform} />
      ))}
    </Box>
  );
};

export default SocialIcons;