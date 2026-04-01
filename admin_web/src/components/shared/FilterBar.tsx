import React, { useState } from 'react';
import { Paper, TextField, InputAdornment, Button, FormControl, InputLabel, Select, MenuItem, Box, Tabs, Tab, Drawer, Typography, IconButton, Chip, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import { useThemeContext } from '../../contexts/ThemeContext';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  name: string;
  label: string;
  type?: 'select' | 'text';
  options?: FilterOption[];
  defaultValue?: string;
  isSecondary?: boolean;
}

export interface TabConfig {
  label: string;
  value: any;
}

export interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (name: string, value: string) => void;
  onClearFilters?: () => void;
  tabs?: TabConfig[];
  activeTab?: any;
  onTabChange?: (value: any) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  tabs,
  activeTab,
  onTabChange
}) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const [drawerOpen, setDrawerOpen] = useState(false);

  const primaryFilters = filters.filter(f => !f.isSecondary);
  const secondaryFilters = filters.filter(f => f.isSecondary);
  
  const activeChips = filters.filter(f => {
    const val = filterValues[f.name];
    if (!val || val === '' || val === 'all' || val === f.defaultValue) return false;
    return true;
  }).map(f => {
    const val = filterValues[f.name];
    let valueLabel = val;
    if (f.options) {
      const opt = f.options.find(o => o.value === val);
      if (opt) valueLabel = opt.label;
    }
    return { name: f.name, label: f.label, valueLabel };
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          bgcolor: isDark ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          borderRadius: 2,
        }}
      >
        {tabs && tabs.length > 0 && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newVal) => onTabChange?.(newVal)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ minHeight: 40 }}
            >
              {tabs.map((tab) => (
                <Tab
                  key={tab.value}
                  label={tab.label}
                  value={tab.value}
                  sx={{ textTransform: 'none', minHeight: 40, fontWeight: 500 }}
                />
              ))}
            </Tabs>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: '280px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          {primaryFilters.map((flt) => {
            if (flt.type === 'text') {
              return (
                <TextField
                  key={flt.name}
                  size="small"
                  label={flt.label}
                  value={filterValues[flt.name] || ''}
                  onChange={(e) => onFilterChange?.(flt.name, e.target.value)}
                  sx={{ minWidth: 140 }}
                />
              );
            }
            return (
              <FormControl key={flt.name} size="small" sx={{ minWidth: 140 }}>
                <InputLabel>{flt.label}</InputLabel>
                <Select
                  label={flt.label}
                  value={filterValues[flt.name] || flt.defaultValue || 'all'}
                  onChange={(e) => onFilterChange?.(flt.name, e.target.value as string)}
                >
                  {(flt.options || []).map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          })}

          {secondaryFilters.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setDrawerOpen(true)}
              sx={{
                textTransform: 'none',
                height: 40,
                borderColor: isDark ? '#334155' : '#e2e8f0',
                color: 'text.primary',
              }}
            >
              More Filters
            </Button>
          )}
        </Box>
      </Paper>
      
      {activeChips.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontWeight: 500 }}>
            Active Filters:
          </Typography>
          {activeChips.map(chip => (
             <Chip 
               key={chip.name} 
               label={`${chip.label}: ${chip.valueLabel}`} 
               size="small" 
               onDelete={() => onFilterChange?.(chip.name, 'all')}
               sx={{ bgcolor: isDark ? '#334155' : '#f1f5f9', fontWeight: 500 }}
             />
          ))}
          {onClearFilters && (
            <Button size="small" onClick={onClearFilters} sx={{ textTransform: 'none', ml: 1 }}>Clear All</Button>
          )}
        </Stack>
      )}

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 320, p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="600">More Filters</Typography>
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {secondaryFilters.map((flt) => {
              if (flt.type === 'text') {
                return (
                  <TextField
                    key={flt.name}
                    size="small"
                    fullWidth
                    label={flt.label}
                    value={filterValues[flt.name] || ''}
                    onChange={(e) => onFilterChange?.(flt.name, e.target.value)}
                  />
                );
              }
              return (
                <FormControl key={flt.name} size="small" fullWidth>
                  <InputLabel>{flt.label}</InputLabel>
                  <Select
                    label={flt.label}
                    value={filterValues[flt.name] || flt.defaultValue || 'all'}
                    onChange={(e) => onFilterChange?.(flt.name, e.target.value as string)}
                  >
                    {(flt.options || []).map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            })}
          </Box>
          <Box sx={{ mt: 'auto', display: 'flex', gap: 2, pt: 3 }}>
            <Button fullWidth variant="outlined" onClick={() => { if(onClearFilters) onClearFilters(); setDrawerOpen(false); }}>
              Clear All
            </Button>
            <Button fullWidth variant="contained" onClick={() => setDrawerOpen(false)}>
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};
