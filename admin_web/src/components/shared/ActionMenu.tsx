import React from 'react';
import { Menu, MenuItem, IconButton, ListItemIcon, ListItemText } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import { useThemeContext } from '../../contexts/ThemeContext';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: (id?: string) => void;
  color?: 'default' | 'error' | 'success' | 'warning' | 'info';
  disabled?: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  id?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ items, id }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getDefaultIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('edit')) return <EditIcon fontSize="small" />;
    if (l.includes('view') || l.includes('detail')) return <VisibilityIcon fontSize="small" />;
    if (l.includes('delete') || l.includes('remove')) return <DeleteIcon fontSize="small" />;
    if (l.includes('approve') || l.includes('activate')) return <CheckCircleIcon fontSize="small" />;
    if (l.includes('reject') || l.includes('suspend') || l.includes('deactivate')) return <BlockIcon fontSize="small" />;
    return null;
  };

  return (
    <>
      <IconButton size="small" onClick={handleClick} aria-label={`actions${id ? `-${id}` : ''}`}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              bgcolor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              minWidth: 160,
              mt: 1
            }
          }
        }}
      >
        {items.map((item, index) => {
          let itemColor = isDark ? '#e2e8f0' : '#1e293b';
          let iconColor = isDark ? '#94a3b8' : '#64748b';
          
          if (item.color === 'error' || item.label.toLowerCase().includes('delete') || item.label.toLowerCase().includes('reject')) {
            itemColor = isDark ? '#f87171' : '#dc2626';
            iconColor = isDark ? '#f87171' : '#dc2626';
          } else if (item.color === 'success' || item.label.toLowerCase().includes('approve')) {
            itemColor = isDark ? '#34d399' : '#16a34a';
            iconColor = isDark ? '#34d399' : '#16a34a';
          }

          return (
            <MenuItem 
              key={index} 
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
                item.onClick(id);
              }}
              disabled={item.disabled}
              sx={{ py: 1, px: 2 }}
            >
              <ListItemIcon sx={{ color: iconColor }}>
                {item.icon || getDefaultIcon(item.label)}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ 
                  variant: 'body2', 
                  sx: { fontWeight: 500, color: itemColor } 
                }} 
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};
