import React from 'react';
import { Paper, TextField, InputAdornment, Button, FormControl, InputLabel, Select, MenuItem, Box, Tabs, Tab } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useThemeContext } from '../../contexts/ThemeContext';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  name: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string;
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
  tabs,
  activeTab,
  onTabChange
}) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 3, 
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
        bgcolor: isDark ? '#1e293b' : '#ffffff',
        overflow: 'hidden'
      }}
    >
      {tabs && tabs.length > 0 && (
        <Box sx={{ borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, px: 1 }}>
          <Tabs 
            value={activeTab ?? 0} 
            onChange={(_, nv) => onTabChange && onTabChange(nv)} 
            variant="scrollable" 
            scrollButtons="auto" 
            sx={{ 
              minHeight: 40,
              '& .MuiTab-root': { 
                minHeight: 40, 
                textTransform: 'none', 
                fontWeight: 600, 
                px: 3,
                fontSize: '0.875rem'
              } 
            }}
          >
            {tabs.map((tab, i) => (
              <Tab key={i} label={tab.label} value={tab.value} />
            ))}
          </Tabs>
        </Box>
      )}
      
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: '300px' } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
        />
        
        {filters.map((filter, idx) => (
          <FormControl key={idx} size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{filter.label}</InputLabel>
            <Select 
              label={filter.label} 
              value={filterValues[filter.name] ?? filter.defaultValue ?? 'all'}
              onChange={(e) => onFilterChange && onFilterChange(filter.name, e.target.value as string)}
            >
              <MenuItem value="all">All {filter.label}s</MenuItem>
              {filter.options.map((opt, i) => (
                <MenuItem key={i} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
        
        {(filters.length > 0) && (
          <Button 
            variant="text" 
            startIcon={<FilterListIcon />} 
            sx={{ textTransform: 'none', color: isDark ? '#cbd5e1' : '#64748b' }}
          >
            More Filters
          </Button>
        )}
      </Box>
    </Paper>
  );
};
