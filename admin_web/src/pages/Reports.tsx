import React, { useState } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton,
    InputAdornment,
    TextField,
    Button,
    MenuItem,
    Select,
    Paper,
    Breadcrumbs,
    Link,
    Chip,
    Tooltip,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

// Primary blue color
const PRIMARY_BLUE = '#2563eb';
const PRIMARY_BLUE_DARK = '#1d4ed8';
const PRIMARY_BLUE_LIGHT = '#3b82f6';

// Mock Data
const reports = [
    { id: 1, name: 'Food & Beverages', region: 'East Java', quantity: 25, price: '$1,250.00', status: 'Active', date: 'Mon, 23 Sept 2024 - 17:00' },
    { id: 2, name: 'Clothing', region: 'North Sulawesi', quantity: 25, price: '$1,250.00', status: 'Active', date: 'Mon, 23 Sept 2024 - 17:00' },
    { id: 3, name: 'Plants', region: 'East Java', quantity: 25, price: '$1,250.00', status: 'Inactive', date: 'Mon, 23 Sept 2024 - 17:00' },
    { id: 4, name: 'Kitchen Supplies', region: 'Central Java', quantity: 25, price: '$1,250.00', status: 'Inactive', date: 'Mon, 23 Sept 2024 - 17:00' },
    { id: 5, name: 'Plants', region: 'East Java', quantity: 25, price: '$1,250.00', status: 'Active', date: 'Mon, 23 Sept 2024 - 17:00' },
    { id: 6, name: 'Clothing', region: 'West Java', quantity: 25, price: '$1,250.00', status: 'Inactive', date: 'Mon, 23 Sept 2024 - 17:00' },
    { id: 7, name: 'Plants', region: 'East Java', quantity: 25, price: '$1,250.00', status: 'Inactive', date: 'Mon, 23 Sept 2024 - 17:00' },
    { id: 8, name: 'Plants', region: 'NTT', quantity: 25, price: '$1,250.00', status: 'Active', date: 'Mon, 23 Sept 2024 - 17:00' },
    { id: 9, name: 'Electronics', region: 'Jakarta', quantity: 50, price: '$2,500.00', status: 'Active', date: 'Mon, 23 Sept 2024 - 17:00' },
    { id: 10, name: 'Furniture', region: 'Bali', quantity: 15, price: '$3,750.00', status: 'Inactive', date: 'Mon, 23 Sept 2024 - 17:00' },
];

// Status Chip Component
const StatusChip: React.FC<{ status: string }> = ({ status }) => {
    const isActive = status === 'Active';
    return (
        <Chip
            label={status}
            size="small"
            sx={{
                height: 26,
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: isActive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: isActive ? '#15803d' : '#dc2626',
                border: 'none',
                '& .MuiChip-label': { px: 1.5 },
            }}
        />
    );
};

// Pagination
const Pagination: React.FC = () => {
    const pages = [1, 2, 3, 4];
    const [currentPage, setCurrentPage] = useState(1);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button size="small" sx={{ color: '#94a3b8', fontSize: '0.8125rem', minWidth: 'auto', px: 1.5, '&:hover': { backgroundColor: '#f1f5f9' } }}>
                ← Prev
            </Button>
            {pages.map((page) => (
                <Box
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    sx={{
                        width: 34,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        backgroundColor: page === currentPage ? PRIMARY_BLUE : 'transparent',
                        color: page === currentPage ? '#FFFFFF' : '#64748b',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { backgroundColor: page === currentPage ? PRIMARY_BLUE : '#f1f5f9' },
                    }}
                >
                    {page}
                </Box>
            ))}
            <Typography sx={{ color: '#94a3b8', px: 1, fontSize: '0.8125rem' }}>...</Typography>
            <Box sx={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '0.875rem', color: '#64748b', cursor: 'pointer', '&:hover': { backgroundColor: '#f1f5f9' } }}>
                99
            </Box>
            <Button size="small" sx={{ color: '#1e293b', fontSize: '0.8125rem', fontWeight: 600, minWidth: 'auto', px: 1.5, '&:hover': { backgroundColor: '#f1f5f9' } }}>
                Next →
            </Button>
        </Box>
    );
};

export const Reports: React.FC = () => {
    const [region, setRegion] = useState('All Regions');

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Breadcrumbs separator="›" sx={{ '& .MuiBreadcrumbs-separator': { color: '#cbd5e1' } }}>
                    <Link underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontSize: '0.8125rem', '&:hover': { color: PRIMARY_BLUE } }} href="/">
                        <HomeOutlinedIcon sx={{ fontSize: 16 }} />
                        Home
                    </Link>
                    <Typography sx={{ fontSize: '0.8125rem', color: PRIMARY_BLUE, fontWeight: 500 }}>Inventory</Typography>
                </Breadcrumbs>
                <IconButton sx={{ color: '#64748b', backgroundColor: '#f8fafc', '&:hover': { backgroundColor: '#f1f5f9' } }}>
                    <NotificationsNoneOutlinedIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </Box>

            {/* Title & Actions Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
                        Inventory Data
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>
                        Manage and track all inventory items across regions
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadOutlinedIcon />}
                        sx={{
                            borderColor: '#e2e8f0',
                            color: '#475569',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            px: 2.5,
                            py: 1,
                            borderRadius: '10px',
                            textTransform: 'none',
                            '&:hover': { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
                        }}
                    >
                        Export
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                            background: `linear-gradient(135deg, ${PRIMARY_BLUE} 0%, ${PRIMARY_BLUE_LIGHT} 100%)`,
                            color: '#FFFFFF',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            px: 2.5,
                            py: 1,
                            borderRadius: '10px',
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                            '&:hover': {
                                background: `linear-gradient(135deg, ${PRIMARY_BLUE_DARK} 0%, ${PRIMARY_BLUE} 100%)`,
                                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)',
                            },
                        }}
                    >
                        Add Data
                    </Button>
                </Box>
            </Box>

            {/* Filters Row */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                <TextField
                    placeholder="Search items..."
                    size="small"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        width: 280,
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: '#FFFFFF',
                            borderRadius: '10px',
                            fontSize: '0.8125rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            '& fieldset': { borderColor: '#e2e8f0' },
                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                            '&.Mui-focused fieldset': { borderColor: PRIMARY_BLUE, borderWidth: 1 },
                        },
                    }}
                />
                <Button
                    variant="outlined"
                    startIcon={<CalendarTodayOutlinedIcon sx={{ fontSize: 14 }} />}
                    sx={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#e2e8f0',
                        color: '#475569',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        px: 2,
                        borderRadius: '10px',
                        textTransform: 'none',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        '&:hover': { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
                    }}
                >
                    1 Sept - 30 Sept 2024
                </Button>
                <Select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    size="small"
                    IconComponent={KeyboardArrowDownIcon}
                    sx={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        minWidth: 160,
                        fontSize: '0.8125rem',
                        color: '#475569',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                    }}
                >
                    <MenuItem value="All Regions">All Regions</MenuItem>
                    <MenuItem value="East Java">East Java</MenuItem>
                    <MenuItem value="West Java">West Java</MenuItem>
                    <MenuItem value="Jakarta">Jakarta</MenuItem>
                </Select>
            </Box>

            {/* Data Table - Full Width */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.04)',
                }}
            >
                <TableContainer>
                    <Table sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                <TableCell sx={{ width: 60, fontWeight: 600, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: '1px solid #e2e8f0' }}>No</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: '1px solid #e2e8f0' }}>Item Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: '1px solid #e2e8f0' }}>Region</TableCell>
                                <TableCell sx={{ width: 80, fontWeight: 600, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: '1px solid #e2e8f0' }}>Qty</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: '1px solid #e2e8f0' }}>Total Price</TableCell>
                                <TableCell sx={{ width: 100, fontWeight: 600, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: '1px solid #e2e8f0' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: '1px solid #e2e8f0' }}>Created Date & Time</TableCell>
                                <TableCell sx={{ width: 140, fontWeight: 600, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: '1px solid #e2e8f0' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reports.map((row, index) => (
                                <TableRow
                                    key={row.id}
                                    sx={{
                                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#fafbfc',
                                        transition: 'background-color 0.15s ease',
                                        '&:hover': { backgroundColor: '#f1f5f9' },
                                        '& td': { borderBottom: '1px solid #f1f5f9', py: 2 },
                                    }}
                                >
                                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>{row.id}</TableCell>
                                    <TableCell sx={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 500 }}>{row.name}</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>{row.region}</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>{row.quantity}</TableCell>
                                    <TableCell sx={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 600 }}>{row.price}</TableCell>
                                    <TableCell><StatusChip status={row.status} /></TableCell>
                                    <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>{row.date}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="View">
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: '#f1f5f9',
                                                        borderRadius: '8px',
                                                        width: 32,
                                                        height: 32,
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': { backgroundColor: PRIMARY_BLUE, color: '#FFFFFF' },
                                                    }}
                                                >
                                                    <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: '#f1f5f9',
                                                        borderRadius: '8px',
                                                        width: 32,
                                                        height: 32,
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': { backgroundColor: PRIMARY_BLUE_LIGHT, color: '#FFFFFF' },
                                                    }}
                                                >
                                                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: '#f1f5f9',
                                                        borderRadius: '8px',
                                                        width: 32,
                                                        height: 32,
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': { backgroundColor: '#ef4444', color: '#FFFFFF' },
                                                    }}
                                                >
                                                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2.5, borderTop: '1px solid #f1f5f9', backgroundColor: '#fafbfc' }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>
                        Showing <Box component="span" sx={{ fontWeight: 600, color: '#1e293b' }}>10</Box> of <Box component="span" sx={{ fontWeight: 600, color: '#1e293b' }}>1,000</Box> records
                    </Typography>
                    <Pagination />
                </Box>
            </Paper>
        </Box>
    );
};
