import React from 'react';
import { Box, Paper, Typography, Chip, TextField, Button, LinearProgress } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import FlashOnIcon from '@mui/icons-material/FlashOn';

interface InformationGatheringPanelProps {
    completeness: number;
    receivedInfo: string[];
    missingFields: Array<{
        field: string;
        question: string;
        example?: string;
    }>;
    recommendations?: {
        location?: string;
        temperature?: string;
        estimatedLoad?: string;
    };
    onSubmitAnswer: (answer: string) => void;
}

const InformationGatheringPanel: React.FC<InformationGatheringPanelProps> = ({
    completeness,
    receivedInfo,
    missingFields,
    recommendations,
    onSubmitAnswer
}) => {
    const [answer, setAnswer] = React.useState('');

    const handleSubmit = () => {
        if (answer.trim()) {
            onSubmitAnswer(answer);
            setAnswer('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Don't show if completeness is 100%
    if (completeness >= 100) return null;

    return (
        <Box sx={{ mb: 2 }}>
            {/* More Information Needed Panel */}
            <Paper
                elevation={2}
                sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: '#FFF9E6',
                    border: '2px solid #FFA726',
                    borderRadius: 2
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <InfoIcon sx={{ color: '#F57C00' }} />
                        <Typography variant="h6" color="#E65100" fontWeight="bold">
                            More Information Needed
                        </Typography>
                    </Box>
                    <Chip
                        label={`${Math.round(completeness)}% complete`}
                        size="small"
                        sx={{
                            bgcolor: '#FFA726',
                            color: 'white',
                            fontWeight: 'bold'
                        }}
                    />
                </Box>

                {/* Progress Bar */}
                <LinearProgress
                    variant="determinate"
                    value={completeness}
                    sx={{
                        height: 8,
                        borderRadius: 1,
                        mb: 2,
                        bgcolor: '#FFE0B2',
                        '& .MuiLinearProgress-bar': {
                            bgcolor: '#FF9800'
                        }
                    }}
                />

                {/* Information Received */}
                {receivedInfo && receivedInfo.length > 0 && (
                    <Box mb={2}>
                        <Typography
                            variant="subtitle2"
                            color="success.main"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}
                        >
                            <CheckCircleIcon fontSize="small" />
                            Information received:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {receivedInfo.map((info, idx) => {
                                // Safely convert info to string
                                const infoText = typeof info === 'string' ? info :
                                    (info && typeof info === 'object' ?
                                        (info.text || info.field || info.value || JSON.stringify(info)) :
                                        String(info));
                                return (
                                    <Chip
                                        key={idx}
                                        label={infoText}
                                        size="small"
                                        sx={{
                                            bgcolor: '#C8E6C9',
                                            color: '#2E7D32',
                                            fontWeight: 500
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                )}

                {/* Please Provide */}
                {missingFields && missingFields.length > 0 && (
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                            Please provide:
                        </Typography>
                        {missingFields.map((field, idx) => {
                            // Safely extract question text from field object
                            const questionText = typeof field === 'string' ? field :
                                (field && typeof field === 'object' ?
                                    (field.question || field.text || field.field || JSON.stringify(field)) :
                                    String(field));
                            const exampleText = field && typeof field === 'object' ?
                                (field.example || field.placeholder || '') : '';

                            return (
                                <Box
                                    key={idx}
                                    sx={{
                                        mb: idx < missingFields.length - 1 ? 1.5 : 0,
                                        p: 1.5,
                                        bgcolor: 'white',
                                        borderRadius: 1
                                    }}
                                >
                                    <Typography variant="body2" fontWeight="bold" color="text.primary">
                                        {idx + 1}. {questionText}
                                    </Typography>
                                    {exampleText && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                            Example: {exampleText}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })}

                        {/* Answer Input */}
                        <Box display="flex" gap={1} mt={2}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Type your answers here..."
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                onKeyPress={handleKeyPress}
                                sx={{ bgcolor: 'white' }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={!answer.trim()}
                                sx={{
                                    bgcolor: '#FF9800',
                                    '&:hover': { bgcolor: '#F57C00' }
                                }}
                            >
                                Submit
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Smart Recommendations Panel */}
            {recommendations && Object.keys(recommendations).length > 0 && (
                <Paper
                    elevation={2}
                    sx={{
                        p: 2,
                        bgcolor: '#E8F5E9',
                        border: '2px solid #66BB6A',
                        borderRadius: 2
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <CheckCircleIcon sx={{ color: '#43A047' }} />
                        <Typography variant="h6" color="#2E7D32" fontWeight="bold">
                            Smart Recommendations
                        </Typography>
                    </Box>

                    <Box display="flex" gap={3}>
                        {recommendations.location && (
                            <Box>
                                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                    <LocationOnIcon fontSize="small" sx={{ color: '#F44336' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        Location
                                    </Typography>
                                </Box>
                                <Typography variant="body2" fontWeight="bold">
                                    {recommendations.location}
                                </Typography>
                            </Box>
                        )}

                        {recommendations.temperature && (
                            <Box>
                                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                    <ThermostatIcon fontSize="small" sx={{ color: '#2196F3' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        Temperature
                                    </Typography>
                                </Box>
                                <Typography variant="body2" fontWeight="bold">
                                    {recommendations.temperature}
                                </Typography>
                            </Box>
                        )}

                        {recommendations.estimatedLoad && (
                            <Box>
                                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                    <FlashOnIcon fontSize="small" sx={{ color: '#FF9800' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        Est. Load
                                    </Typography>
                                </Box>
                                <Typography variant="body2" fontWeight="bold">
                                    {recommendations.estimatedLoad}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default InformationGatheringPanel;
