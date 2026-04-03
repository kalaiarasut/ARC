import { Drawer, Box, Typography, Stack, alpha, useTheme, Avatar, IconButton } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab';
import { Close as CloseIcon, Update as UpdateIcon, Add as CreateIcon, Delete as DeleteIcon, InfoOutlined as InfoIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { DiffViewer } from './DiffViewer';
import type { AuditEvent } from '../../types/audit';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  entityName: string;
  events: AuditEvent[];
  loading?: boolean;
}

export function HistoryDrawer({ open, onClose, entityName, events, loading = false }: HistoryDrawerProps) {
  const theme = useTheme();

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <CreateIcon sx={{ fontSize: '1.2rem' }} />;
      case 'deleted': return <DeleteIcon sx={{ fontSize: '1.2rem' }} />;
      case 'updated':
      case 'status_changed':
      default: return <UpdateIcon sx={{ fontSize: '1.2rem' }} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return theme.palette.success.main;
      case 'deleted': return theme.palette.error.main;
      case 'entered':
      case 'exited':
      case 'session_started':
      case 'session_stopped':
        return theme.palette.warning.main;
      case 'updated':
      case 'status_changed':
      default: return theme.palette.info.main;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      elevation={8}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: '65vw', md: '55vw', lg: '45vw' },
          bgcolor: 'background.default',
          borderLeft: `1px solid ${theme.palette.divider}`,
        }
      }}
    >
      <Box sx={{
        px: 4, py: 3,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)'
      }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 0.5, color: 'text.primary' }}>Audit History</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {entityName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ 
          bgcolor: alpha(theme.palette.text.primary, 0.04), 
          color: theme.palette.text.secondary,
          '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.08) } 
        }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 4, overflowY: 'auto' }}>
        {loading ? (
          <Typography variant="body2" color="text.secondary" align="center" mt={4}>Loading history...</Typography>
        ) : events.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8, opacity: 0.7 }}>
            <Typography variant="h6" color="text.secondary">No history found</Typography>
            <Typography variant="body2" color="text.secondary">This entity has no recorded changes.</Typography>
          </Box>
        ) : (
          <Timeline position="right" sx={{ p: 0, m: 0 }}>
            {events.map((event, index) => {
              const isLast = index === events.length - 1;
              const color = getActionColor(event.action);

              return (
                <TimelineItem key={event.id} sx={{ mb: 4, minHeight: 120 }}>
                  <TimelineOppositeContent sx={{ flex: 0.15, pl: 0, pr: 3, pt: 1.5, color: 'text.secondary', textAlign: 'right' }}>
                    <Typography variant="body2" display="block" fontWeight={700} sx={{ color: 'text.primary' }}>
                      {format(new Date(event.created_at), 'MMM dd')}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {format(new Date(event.created_at), 'HH:mm')}
                    </Typography>
                  </TimelineOppositeContent>

                  <TimelineSeparator>
                    <TimelineDot sx={{ 
                      bgcolor: "background.paper", 
                      color: color,
                      boxShadow: 'none', 
                      border: `1px solid ${alpha(color, 0.5)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      p: 0.8, mt: 1
                    }}>
                      {getActionIcon(event.action)}
                    </TimelineDot>
                    {!isLast && <TimelineConnector sx={{ bgcolor: theme.palette.divider, width: 1, my: 1 }} />}
                  </TimelineSeparator>

                  <TimelineContent sx={{ pb: 0, pt: 0, pr: 0, pl: 3 }}>
                    <Box sx={{
                      bgcolor: "background.paper",
                      borderRadius: '12px',
                      p: 2.5,
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 3px rgba(0,0,0,0.02)'
                    }}>
                      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: theme.palette.primary.main, color: "#fff", fontSize: '0.75rem', fontWeight: 700 }}>
                          {(event.actor_email ?? 'S').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                            {event.actor_email ?? 'System'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                            {event.action} {event.entity_type}
                          </Typography>
                        </Box>
                      </Stack>

                      {event.reason && (
                        <Box sx={{ 
                          bgcolor: alpha(theme.palette.text.primary, 0.02), 
                          p: 1.5, 
                          borderRadius: '6px', 
                          mb: 2.5, 
                          borderLeft: `3px solid ${theme.palette.text.disabled}`,
                          display: 'flex', gap: 1.2, alignItems: 'flex-start'
                        }}>
                          <InfoIcon sx={{ color: 'text.secondary', fontSize: '1.1rem', mt: 0.1 }} />
                          <Box>
                            <Typography variant="caption" fontWeight={700} display="block" sx={{ color: 'text.secondary', mb: 0.2, letterSpacing: '0.05em' }}>REASON</Typography>
                            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{event.reason}</Typography>
                          </Box>
                        </Box>
                      )}

                      <DiffViewer oldData={event.old_data} newData={event.new_data} metadata={event.metadata} />
                    </Box>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </Box>
    </Drawer>
  );
}
