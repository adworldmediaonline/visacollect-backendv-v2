import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus[dbState] || 'unknown',
        name: mongoose.connection.name || null,
        host: mongoose.connection.host || null,
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.version,
    };

    // Return 503 if database is not connected
    if (dbState !== 1) {
      return res.status(503).json({
        ...healthCheck,
        status: 'error',
        message: 'Database connection issue',
      });
    }

    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Readiness probe endpoint
router.get('/ready', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;

    if (dbState === 1) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        message: 'Database not connected',
      });
    }
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Readiness check failed',
    });
  }
});

export default router;
