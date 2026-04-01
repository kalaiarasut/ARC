import { Drawer, Box, Typography, Stack, alpha, useTheme, Avatar, IconButton, Paper } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab';
import { Close as CloseIcon, Update as UpdateIcon, Add as CreateIcon, Delete as DeleteIcon, InfoOutlined as InfoIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { DiffViewer } from './DiffViewer';

interface AuditEvent {
  id: string;
  action: 'create' | 'update' | 'delete' | 'transition';
  changed_at: string;
  admin_email: string;
  old_data?: any;
  new_data?: any;
  reason?: string;
  entity_type: string;
}

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
      case 'create': return <CreateIcon sx={{ fontSize: '1.2rem' }} />;
      case 'delete': return <DeleteIcon sx={{ fontSize: '1.2rem' }} />;
      case 'update': default: return <UpdateIcon sx={{ fontSize: '1.2rem' }} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return theme.palette.success.main;
      case 'delete': return theme.palette.error.main;
      case 'transition': return theme.palette.warning.main;
      case 'update': default: return theme.palette.info.main;
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
          bgcolor: '#f8fafc',
          borderLeft: `1px solid ${theme.palette.divider}`,
        }
      }}
    >
      <Box sx={{
        px: 4, py: 3,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: '#ffffff',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)'
      }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>Audit History</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {entityName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ 
          bgcolor: theme.palette.grey[100], 
          color: theme.palette.grey[600],
          '&:hover': { bgcolor: theme.palette.grey[200] } 
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
                      {format(new Date(event.changed_at), 'MMM dd')}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {format(new Date(event.changed_at), 'HH:mm')}
                    </Typography>
                  </TimelineOppositeContent>

                  <TimelineSeparator>
                    <TimelineDot sx={{ 
                      bgcolor: '#ffffff', 
                      color: color,
                      boxShadow: 'none', 
                      border: `1px solid ${alpha(color, 0.4)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      p: 0.8, mt: 1
                    }}>
                      {getActionIcon(event.action)}
                    </TimelineDot>
                    {!isLast && <TimelineConnector sx={{ bgcolor: theme.palette.divider, width: 1, my: 1 }} />}
                  </TimelineSeparator>

                  <TimelineContent sx={{ pb: 0, pt: 0, pr: 0, pl: 3 }}>
                    <Box sx={{
                      bgcolor: '#ffffff',
                      borderRadius: '12px',
                      p: 2.5,
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}>
                      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: theme.palette.primary.main, color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                          {event.admin_email.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary', lineHeight: 1.2 }}>{event.admin_email}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                            {event.action} {event.entity_type}
                          </Typography>
                        </Box>
                      </Stack>

                      {event.reason && (
                        <Box sx={{ 
                          bgcolor: '#f8fafc', 
                          p: 1.5, 
                          borderRadius: '6px', 
                          mb: 2.5, 
                          borderLeft: '3px solid #cbd5e1',
                          display: 'flex', gap: 1.2, alignItems: 'flex-start'
                        }}>
                          <InfoIcon sx={{ color: '#64748b', fontSize: '1.1rem', mt: 0.1 }} />
                          <Box>
                            <Typography variant="caption" fontWeight={700} display="block" sx={{ color: '#475569', mb: 0.2, letterSpacing: '0.05em' }}>REASON</Typography>
                            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>{event.reason}</Typography>
                          </Box>
                        </Box>
                      )}

                      <DiffViewer oldData={event.old_data} newData={event.new_data} />
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