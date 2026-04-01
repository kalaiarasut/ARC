import { Box, Typography, Stack, useTheme, alpha } from '@mui/material';
import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();

interface DiffViewerProps {
  oldData: any;
  newData: any;
}

export function DiffViewer({ oldData, newData }: DiffViewerProps) {
  const theme = useTheme();

  if (!oldData && !newData) return <Typography variant="body2" color="text.secondary">No changes</Typography>;

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
        bgcolor: '#0f172a', color: '#e2e8f0', p: 1.5, 
        borderRadius: '8px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', 
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: `1px solid ${theme.palette.divider}` 
      }}>
        {diffs.map((part, index) => {
          const type = part[0];
          const text = part[1];
          if (type === 1) {
            return <Box component="span" key={index} sx={{ bgcolor: alpha(theme.palette.success.main, 0.4), color: '#bbf7d0', px: 0.5, borderRadius: '2px', fontWeight: 600 }}>{text}</Box>;
          } else if (type === -1) {
            return <Box component="span" key={index} sx={{ bgcolor: alpha(theme.palette.error.main, 0.4), color: '#fecaca', textDecoration: 'line-through', px: 0.5, borderRadius: '2px', opacity: 0.8 }}>{text}</Box>;
          }
          return <span key={index}>{text}</span>;
        })}
      </Box>
    );
  };

  const renderBadgeDiff = (oldVal: any, newVal: any) => (
    <Stack direction="row" spacing={1.5} alignItems="center">
      {oldVal ? (
        <Box sx={{ px: 1.2, py: 0.4, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'line-through' }}>
          {String(oldVal)}
        </Box>
      ) : <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>null</Typography>}
      
      <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 700 }}>➞</Typography>
      
      {newVal ? (
        <Box sx={{ px: 1.2, py: 0.4, bgcolor: '#ecfdf5', color: '#15803d', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
          {String(newVal)}
        </Box>
      ) : <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>null</Typography>}
    </Stack>
  );

  const renderGenericDiff = (oldVal: any, newVal: any) => {
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
            fontWeight: 700, color: '#94a3b8', display: 'block', mb: 1, 
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
