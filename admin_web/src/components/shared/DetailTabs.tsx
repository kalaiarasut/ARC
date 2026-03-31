import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { useThemeContext } from '../../contexts/ThemeContext';

export interface DetailTabItem {
  label: string;
  value: string;
  content: React.ReactNode;
}

export interface DetailTabsProps {
  tabs: DetailTabItem[];
  value: string;
  onChange: (value: string) => void;
}

export const DetailTabs: React.FC<DetailTabsProps> = ({ tabs, value, onChange }) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: isDark ? '#334155' : 'divider' }}>
        <Tabs
          value={value}
          onChange={(_, nextValue: string) => onChange(nextValue)}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              minWidth: 100,
              py: 1,
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>
      </Box>
      <Box sx={{ pt: 2 }}>
        {tabs.find((tab) => tab.value === value)?.content}
      </Box>
    </Box>
  );
};
