import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Stack,
  InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RadarIcon from '@mui/icons-material/Radar';
import EventIcon from '@mui/icons-material/Event';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { FormSection } from '../FormSection';
import type { AdvisoryFormState } from '../hooks/useAdvisoryForm';

export interface LocationContactsStepProps {
  form: AdvisoryFormState;
  updateField: <K extends keyof AdvisoryFormState>(field: K, value: AdvisoryFormState[K]) => void;
}

export const LocationContactsStep: React.FC<LocationContactsStepProps> = ({
  form,
  updateField,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
      transition: 'all 0.2s ease',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: alpha(theme.palette.divider, 0.8),
      },
      '&:hover': {
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.8)
          : alpha(theme.palette.grey[50], 0.8),
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
        },
      },
      '&.Mui-focused': {
        bgcolor: 'background.paper',
        '& .MuiOutlinedInput-notchedOutline': {
          borderWidth: 2,
          borderColor: theme.palette.primary.main,
        },
      },
    },
    '& .MuiInputLabel-root': {
      fontWeight: 500,
    },
  };

  return (
    <Box data-step="1">
      <Stack spacing={3}>
        {/* Geographic Targeting Section */}
        <FormSection
          icon={<PlaceOutlinedIcon />}
          title="Geographic Targeting"
          description="Target this advisory to a specific location (optional)"
          color="info"
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Latitude"
                value={form.lat}
                onChange={(e) => updateField('lat', e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g. 13.0827"
                inputProps={{ inputMode: 'decimal' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MyLocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Longitude"
                value={form.lng}
                onChange={(e) => updateField('lng', e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g. 80.2707"
                inputProps={{ inputMode: 'decimal' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MyLocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Radius (km)"
                value={form.radius}
                onChange={(e) => updateField('radius', e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g. 50"
                disabled={!form.lat && !form.lng}
                inputProps={{ inputMode: 'decimal' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <RadarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Validity Period Section */}
        <FormSection
          icon={<ScheduleIcon />}
          title="Validity Period"
          description="When should this advisory be active? (optional)"
          color="primary"
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Starts At"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => updateField('startsAt', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Expires At"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => updateField('expiresAt', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventBusyIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Emergency Contacts Section */}
        <FormSection
          icon={<PhoneIcon />}
          title="Emergency Contacts"
          description="Provide contact numbers for emergency assistance (optional)"
          color="warning"
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Phone Number"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                fullWidth
                size="small"
                placeholder="+91 98765 43210"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="WhatsApp"
                value={form.whatsapp}
                onChange={(e) => updateField('whatsapp', e.target.value)}
                fullWidth
                size="small"
                placeholder="+91 98765 43210"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WhatsAppIcon sx={{ fontSize: 18, color: '#25D366' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Hotline"
                value={form.hotline}
                onChange={(e) => updateField('hotline', e.target.value)}
                fullWidth
                size="small"
                placeholder="1800-XXX-XXXX"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SupportAgentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
          </Grid>
        </FormSection>
      </Stack>
    </Box>
  );
};
