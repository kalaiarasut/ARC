import React, { useMemo, useState } from 'react';
import { Avatar } from '@mui/material';

export interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: number;
}

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, src, size = 34 }) => {
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => initialsFromName(name), [name]);

  return (
    <Avatar
      src={!failed ? src ?? undefined : undefined}
      alt={name}
      onError={() => setFailed(true)}
      sx={{
        width: size,
        height: size,
        bgcolor: '#0D9488',
        color: '#ffffff',
        fontWeight: 700,
        fontSize: size <= 32 ? '0.75rem' : '0.875rem',
      }}
    >
      {initials}
    </Avatar>
  );
};
