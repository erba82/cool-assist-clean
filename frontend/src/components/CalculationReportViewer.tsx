import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Grid,
    Card,
    CardContent,
    Chip,
    Button,
    Divider
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface CalculationReportViewerProps {
    data: any;
}

const CalculationReportViewer: React.FC<CalculationReportViewerProps> = ({ data }) => {
    const [tabIndex, setTabIndex] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
    };

    if (!data) return <Typography>No calculation data available.</Typography>;

    return (
        <Box sx={{ width: '100%', mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4" color="primary" gutterBottom>
                        Project Calculation Report
                    </Typography>
                    <Button variant="contained" color="secondary" startIcon={<DownloadIcon />}>
                        Download PDF Report
                    </Button>
                </Box>

                <Grid container spacing={3} mb={3}>
                    <Grid item xs={12} md={4}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>Total Plant Capacity</Typography>
                                <Typography variant="h5">{data.summary.totalCoolingCapacity}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>Estimated Cost (Best Value)</Typography>
                                <Typography variant="h5">{data.summary.estimatedCost}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>Power Consumption</Typography>
                                <Typography variant="h5">{data.summary.powerConsumption}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Tabs value={tabIndex} onChange={handleTabChange} centered sx={{ mb: 3 }}>
                    <Tab label="Room Loads" />
                    <Tab label="Equipment Selection" />
                    <Tab label="Pricing & BOM" />
                    <Tab label="Piping Schedule" />
                </Tabs>

                {/* TAB 0: ROOM LOADS */}
                {tabIndex === 0 && (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell><strong>Room Name</strong></TableCell>
                                    <TableCell><strong>Temp (°C)</strong></TableCell>
                                    <TableCell align="right"><strong>Transmission (kW)</strong></TableCell>
                                    <TableCell align="right"><strong>Product (kW)</strong></TableCell>
                                    <TableCell align="right"><strong>Infiltration (kW)</strong></TableCell>
                                    <TableCell align="right"><strong>Internal (kW)</strong></TableCell>
                                    <TableCell align="right"><strong>Total Load (kW)</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.roomCalculations.map((room: any, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell>{room.name}</TableCell>
                                        <TableCell>{room.temperature}°C</TableCell>
                                        <TableCell align="right">{room.loads.transmission}</TableCell>
                                        <TableCell align="right">{room.loads.product}</TableCell>
                                        <TableCell align="right">{room.loads.infiltration}</TableCell>
                                        <TableCell align="right">{room.loads.internal}</TableCell>
                                        <TableCell align="right"><strong>{room.loads.total}</strong></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* TAB 1: EQUIPMENT */}
                {tabIndex === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Compressors</Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                                        <TableCell><strong>Stage</strong></TableCell>
                                        <TableCell><strong>Model</strong></TableCell>
                                        <TableCell><strong>Manufacturer</strong></TableCell>
                                        <TableCell><strong>Duty Capacity (kW)</strong></TableCell>
                                        <TableCell><strong>Motor (kW)</strong></TableCell>
                                        <TableCell><strong>Role</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.equipment.compressors.map((comp: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>{comp.stage}</TableCell>
                                            <TableCell>{comp.model}</TableCell>
                                            <TableCell>{comp.manufacturer}</TableCell>
                                            <TableCell>{comp.dutyCapacity}</TableCell>
                                            <TableCell>{comp.dutyPower}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={comp.role || 'Duty'}
                                                    color={comp.role === 'Standby' ? 'default' : 'primary'}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Typography variant="h6" gutterBottom>Evaporators</Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#e8f5e9' }}>
                                        <TableCell><strong>Room</strong></TableCell>
                                        <TableCell><strong>Model</strong></TableCell>
                                        <TableCell><strong>Qty</strong></TableCell>
                                        <TableCell><strong>Capacity (kW)</strong></TableCell>
                                        <TableCell><strong>Fans</strong></TableCell>
                                        <TableCell><strong>Throw (m)</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.equipment.evaporators.map((evap: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>{evap.roomName}</TableCell>
                                            <TableCell>{evap.model}</TableCell>
                                            <TableCell>{evap.quantity}</TableCell>
                                            <TableCell>{evap.capacity}</TableCell>
                                            <TableCell>{evap.fans.count} x {evap.fans.diameter}mm</TableCell>
                                            <TableCell>{evap.throw}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Typography variant="h6" gutterBottom>Condensers & Vessels</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                                                <TableCell><strong>Item</strong></TableCell>
                                                <TableCell><strong>Model/Size</strong></TableCell>
                                                <TableCell><strong>Qty</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.equipment.condensers.map((item: any, i: number) => (
                                                <TableRow key={`cond-${i}`}>
                                                    <TableCell>Condenser</TableCell>
                                                    <TableCell>{item.model} ({item.manufacturer})</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                </TableRow>
                                            ))}
                                            {data.equipment.vessels.map((item: any, i: number) => (
                                                <TableRow key={`ves-${i}`}>
                                                    <TableCell>{item.service}</TableCell>
                                                    <TableCell>{item.volume} L ({item.diameter}x{item.length}mm)</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f3e5f5' }}>
                                                <TableCell><strong>Pump Service</strong></TableCell>
                                                <TableCell><strong>Model</strong></TableCell>
                                                <TableCell><strong>Flow (m³/h)</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.equipment.pumps.map((item: any, i: number) => (
                                                <TableRow key={`pump-${i}`}>
                                                    <TableCell>{item.service}</TableCell>
                                                    <TableCell>{item.model}</TableCell>
                                                    <TableCell>{item.flow}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {/* TAB 2: PRICING */}
                {tabIndex === 2 && (
                    <Box>
                        <Grid container spacing={3} mb={4}>
                            <Grid item xs={12} md={4}>
                                <Card sx={{ borderTop: '4px solid #4caf50' }}>
                                    <CardContent>
                                        <Typography variant="h6" align="center">Economic</Typography>
                                        <Typography variant="h4" align="center" color="primary" sx={{ my: 2 }}>
                                            {formatCurrency(data.pricing.totals.economic)}
                                        </Typography>
                                        <Typography variant="body2" align="center" color="textSecondary">
                                            Budget-friendly option with standard efficiency equipment.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card sx={{ borderTop: '4px solid #2196f3', transform: 'scale(1.05)', boxShadow: 3 }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="center" mb={1}><Chip label="Recommended" color="primary" size="small" /></Box>
                                        <Typography variant="h6" align="center">Best Value</Typography>
                                        <Typography variant="h4" align="center" color="primary" sx={{ my: 2 }}>
                                            {formatCurrency(data.pricing.totals.best)}
                                        </Typography>
                                        <Typography variant="body2" align="center" color="textSecondary">
                                            Optimal balance of performance, efficiency, and cost.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card sx={{ borderTop: '4px solid #9c27b0' }}>
                                    <CardContent>
                                        <Typography variant="h6" align="center">Premium</Typography>
                                        <Typography variant="h4" align="center" color="primary" sx={{ my: 2 }}>
                                            {formatCurrency(data.pricing.totals.premium)}
                                        </Typography>
                                        <Typography variant="body2" align="center" color="textSecondary">
                                            Top-tier equipment with maximum efficiency and longevity.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Typography variant="h6" gutterBottom>Bill of Materials (Best Value Tier)</Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Category</strong></TableCell>
                                        <TableCell><strong>Item Description</strong></TableCell>
                                        <TableCell align="center"><strong>Qty</strong></TableCell>
                                        <TableCell align="right"><strong>Unit Price</strong></TableCell>
                                        <TableCell align="right"><strong>Total Price</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.pricing.itemized.map((item: any, i: number) => (
                                        <TableRow key={i} hover>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell align="center">{item.quantity}</TableCell>
                                            <TableCell align="right">{formatCurrency(item.unitPrice.best)}</TableCell>
                                            <TableCell align="right">{formatCurrency(item.totalPrice.best)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* TAB 3: PIPING */}
                {tabIndex === 3 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Piping Schedule</Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#eceff1' }}>
                                        <TableCell><strong>Service Line</strong></TableCell>
                                        <TableCell><strong>Recommended Size</strong></TableCell>
                                        <TableCell><strong>Material Specification</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.piping.map((line: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>{line.service}</TableCell>
                                            <TableCell><strong>{line.size}</strong></TableCell>
                                            <TableCell>{line.material}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default CalculationReportViewer;
