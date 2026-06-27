import React from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';

const TermsOfService: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, my: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Terms of Service
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" paragraph>
            Please read these terms carefully before using the Cool Assist service. By registering and using our service, you agree to these terms.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            1. General Terms of Use
          </Typography>
          <Typography variant="body1" paragraph>
            You agree to use our services only for lawful purposes and in accordance with these terms. You must not use our services in any way that:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1">
                Violates local, national, or international laws.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Is illegal, harmful, fraudulent, offensive, or harassing.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Is intended to harm or abuse children.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Sends spam, chain emails, or similar content.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Causes disruption or damage to the service or connected networks.
              </Typography>
            </li>
          </ul>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            2. User Account
          </Typography>
          <Typography variant="body1" paragraph>
            When you register for our service, you must provide accurate and complete information. You are responsible for maintaining the security of your username and password, and all activities that occur under your account.
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to suspend or delete your account without prior notice if you violate any of these terms.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            3. Payment and Subscription
          </Typography>
          <Typography variant="body1" paragraph>
            Some features of our service may require payment. Prices and payment terms are displayed on the subscriptions page.
          </Typography>
          <Typography variant="body1" paragraph>
            By purchasing a subscription, you agree to pay the specified amount at the designated intervals. Subscriptions automatically renew unless you cancel at least 24 hours before the end of the current period.
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to change prices, but any price changes will be communicated at least 30 days in advance.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            4. User Content
          </Typography>
          <Typography variant="body1" paragraph>
            When using the service, you may submit or create content. You retain ownership of your content, but grant us a worldwide, non-exclusive, royalty-free license to use, copy, distribute, and display that content in connection with our services.
          </Typography>
          <Typography variant="body1" paragraph>
            You warrant that your content does not violate any third-party rights and complies with our policies.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            5. Intellectual Property
          </Typography>
          <Typography variant="body1" paragraph>
            All intellectual property rights related to the service and its content (except user content) belong to us or our licensors. You may not use our trademarks, logos, or other proprietary marks without written permission.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            6. Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph>
            To the maximum extent permitted by law, we accept no liability for direct, indirect, incidental, special, or consequential damages arising from the use of or inability to use our service.
          </Typography>
          <Typography variant="body1" paragraph>
            Our service is provided "as is" and "as available" without any express or implied warranties.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            7. Changes to Terms of Service
          </Typography>
          <Typography variant="body1" paragraph>
            We may update these terms from time to time. Changes will take effect upon posting the updated terms on our website. Your continued use of the service after changes are posted constitutes acceptance of the new terms.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            8. Governing Law
          </Typography>
          <Typography variant="body1" paragraph>
            These terms are governed by the laws of the Islamic Republic of Iran, and any disputes arising from these terms must be resolved in the courts of that country.
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          Last updated: March 30, 2025
        </Typography>
      </Paper>
    </Container>
  );
};

export default TermsOfService;