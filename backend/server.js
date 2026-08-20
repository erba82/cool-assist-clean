const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const ammoniaDesignRouter = require('./routes/ammoniaDesign');
const renderingRouter = require('./routes/rendering');
const coreDesignRouter = require('./routes/coreDesign');
const chatAPIRouter = require('./routes/chatAPI');
const learningAIRouter = require('./routes/learningAI'); // NEW: Self-Learning AI route
const attachmentRouter = require('./routes/attachments');
const integrationRouter = require('./routes/integrations');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Mount the new GFDDE router
app.use('/api/ammonia', ammoniaDesignRouter);

// Mount rendering router (Phase 4)
app.use('/api/rendering', renderingRouter);

// Mount Core Engine API (v2.0)
app.use('/api/core', coreDesignRouter);

// Mount Intelligent Chat API (v3.0)
app.use('/api/chat', chatAPIRouter);

// Mount Learning AI API (v4.0) - NEW
app.use('/api/learning', learningAIRouter);

// User-provided attachment analysis: read-only and review-gated.
app.use('/api/attachments', attachmentRouter);

// External MCP integrations begin as drafts; activation requires separate approval.
app.use('/api/integrations', integrationRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'GFDDE Backend',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 GFDDE Backend running on port ${PORT}`));