// frontend/src/pages/SubscriptionPlans.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, CardActions,
  Button, Grid, Chip, CircularProgress, Divider,
  List, ListItem, ListItemIcon, ListItemText, Tabs, Tab
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

interface PlanFeature {
  name: string;
  available: boolean;
}

interface Plan {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  interval: 'monthly' | 'quarterly' | 'annual';
  features: PlanFeature[];
  recommended?: boolean;
}

const SubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [interval, setInterval] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIntervalChange = (event: React.SyntheticEvent, newValue: 'monthly' | 'quarterly' | 'annual') => {
    setInterval(newValue);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US').format(price) + ' Toman';
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      // Redirect to payment page
      const response = await axios.post('/api/subscriptions/checkout', {
        planId,
        interval
      });

      // Redirect to payment gateway
      window.location.href = response.data.paymentUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: 'center' }}>
        Choose Subscription Plan
      </Typography>

      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'center' }}>
        <Tabs
          value={interval}
          onChange={handleIntervalChange}
          aria-label="Plan Interval"
        >
          <Tab label="Monthly" value="monthly" />
          <Tab label="Quarterly" value="quarterly" />
          <Tab label="Annually" value="annual" />
        </Tabs>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card
              elevation={plan.recommended ? 8 : 1}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: 2,
                overflow: 'visible',
                transform: plan.recommended ? 'scale(1.05)' : 'none',
                border: plan.recommended ? '2px solid primary.main' : 'none',
              }}
            >
              {plan.recommended && (
                <Chip
                  label="Special Offer"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: -15,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                />
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom align="center" fontWeight="bold">
                  {plan.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" align="center" paragraph>
                  {plan.description}
                </Typography>

                <Typography variant="h4" align="center" sx={{ my: 2 }}>
                  {formatPrice(plan.price)}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {interval === 'monthly' ? 'per month' : interval === 'quarterly' ? 'every 3 months' : 'per year'}
                  </Typography>
                </Typography>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {feature.available ? (
                          <CheckIcon color="success" fontSize="small" />
                        ) : (
                          <CloseIcon color="disabled" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={feature.name}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'center' }}>
                <Button
                  variant={plan.recommended ? "contained" : "outlined"}
                  color="primary"
                  fullWidth
                  onClick={() => handleSelectPlan(plan.id)}
                  size="large"
                >
                  Select this Plan
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SubscriptionPlans;