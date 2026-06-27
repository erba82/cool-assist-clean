import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    CircularProgress,
    Alert
} from '@mui/material';
import AmmoniaDesignWizardComponent from '../components/AmmoniaDesignWizard';

const AmmoniaDesignWizardPage: React.FC = () => {
    const [prompt, setPrompt] = useState('Design a refrigeration system for a slaughterhouse in Ardabil with 4 freezing tunnels (-40C), 1 chilling room (-5C), and 2 storage rooms (-18C).');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);

    const handleDesign = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/ammonia/design-wizard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userPrompt: prompt })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Design generation failed');
            }

            setResult(data.data);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, height: '90vh', display: 'flex', flexDirection: 'column' }}>
            {!result ? (
                <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 8 }}>
                    <Typography variant="h4" gutterBottom color="primary">
                        Ammonia Expert System
                    </Typography>
                    <Typography paragraph color="textSecondary">
                        Describe your project requirements in natural language. The AI will calculate loads, select equipment, and generate diagrams.
                    </Typography>

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        label="Project Description"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleDesign}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Generate Expert Design'}
                    </Button>
                </Paper>
            ) : (
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Button onClick={() => setResult(null)} sx={{ mb: 1 }}>Back to Input</Button>
                    <AmmoniaDesignWizardComponent projectData={result} />
                </Box>
            )}
        </Container>
    );
};

export default AmmoniaDesignWizardPage;
