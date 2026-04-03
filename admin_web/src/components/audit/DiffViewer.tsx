import { Box, Typography, Stack, useTheme, alpha } from '@mui/material';
import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();

interface DiffViewerProps {
  oldData: any;
  newData: any;
  metadata?: any;
}

export function DiffViewer({ oldData, newData, metadata }: DiffViewerProps) {
  const theme = useTheme();

  if (!oldData && !newData) {
    if (!metadata || Object.keys(metadata).length === 0) {
      return <Typography variant="body2" color="text.secondary">No changes</Typography>;
    }

    return (
      <Box
        sx={{
          bgcolor: alpha(theme.palette.text.primary, 0.03),
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '8px',
          p: 1.5,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.75rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {JSON.stringify(metadata, null, 2)}
      </Box>
    );
  }

  const getDiffs = () => {
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    const changes: { key: string; oldVal: any; newVal: any }[] = [];

    Array.from(allKeys).forEach(key => {
      const isDiff = JSON.stringify(oldData?.[key]) !== JSON.stringify(newData?.[key]);
      if (isDiff) {
        changes.push({ key, oldVal: oldData?.[key], newVal: newData?.[key] });
      }
    });

    return changes;
  };

  const changes = getDiffs();

  if (changes.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', opacity: 0.8 }}>
        No discernible data changes inside this payload.
      </Typography>
    );
  }

  // Render specific property types
  const renderTextDiff = (oldText: string, newText: string) => {
    const diffs = dmp.diff_main(oldText || '', newText || '');
    dmp.diff_cleanupSemantic(diffs);

    return (
      <Box sx={{
        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.black, 0.4) : alpha(theme.palette.common.black, 0.8), 
        color: '#e2e8f0', p: 1.5,
        borderRadius: '8px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: `1px solid ${theme.palette.divider}`
      }}>
        {diffs.map((part, index) => {
          const type = part[0];
          const text = part[1];
          if (type === 1) {
            return <Box component="span" key={index} sx={{ bgcolor: alpha(theme.palette.success.main, 0.4), color: theme.palette.success.light, px: 0.5, borderRadius: '2px', fontWeight: 600 }}>{text}</Box>;
          } else if (type === -1) {
            return <Box component="span" key={index} sx={{ bgcolor: alpha(theme.palette.error.main, 0.4), color: theme.palette.error.light, textDecoration: 'line-through', px: 0.5, borderRadius: '2px', opacity: 0.8 }}>{text}</Box>;
          }
          return <span key={index}>{text}</span>;
        })}
      </Box>
    );
  };

  const renderBadgeDiff = (oldVal: any, newVal: any) => (
    <Stack direction="row" spacing={1.5} alignItems="center">
      {oldVal ? (
        <Box sx={{ px: 1.2, py: 0.4, bgcolor: alpha(theme.palette.text.primary, 0.05), color: theme.palette.text.secondary, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'line-through' }}>
          {String(oldVal)}
        </Box>
      ) : <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>null</Typography>}
      
      <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 700 }}>➞</Typography>
      
      {newVal ? (
        <Box sx={{ px: 1.2, py: 0.4, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
          {String(newVal)}
        </Box>
      ) : <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>null</Typography>}
    </Stack>
  );

  const renderGenericDiff = (oldVal: any, newVal: any) => {
    const isStructured =
      (oldVal && typeof oldVal === 'object') ||
      (newVal && typeof newVal === 'object');

    if (isStructured) {
      return renderTextDiff(
        JSON.stringify(oldVal ?? null, null, 2),
        JSON.stringify(newVal ?? null, null, 2),
      );
    }

    if (typeof oldVal === 'string' && typeof newVal === 'string' && (oldVal.length > 40 || newVal.length > 40)) {
      return renderTextDiff(oldVal, newVal);
    }
    return renderBadgeDiff(oldVal, newVal);
  };

  return (
    <Stack spacing={2.5} sx={{ mt: 1 }}>
      {changes.map(({ key, oldVal, newVal }, idx) => (
        <Box key={key} sx={{
          pt: idx > 0 ? 2 : 0,
          borderTop: idx > 0 ? `1px dashed ${theme.palette.divider}` : 'none',
        }}>
          <Typography variant="caption" sx={{ 
            fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1, 
            letterSpacing: '0.04em', textTransform: 'uppercase'
          }}>
            {key.replace(/_/g, ' ')}
          </Typography>
          {renderGenericDiff(oldVal, newVal)}
        </Box>
      ))}
    </Stack>
  );
}
