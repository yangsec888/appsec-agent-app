/**
 * Main Express Server Entry Point for AppSec Agent Dashboard
 * 
 * Author: Sam Li
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { codeReviewRoutes } from './routes/codeReview';
import { threatModelingRoutes } from './routes/threatModeling';
import { chatRoutes } from './routes/chat';
import { authRoutes } from './routes/auth';
import { initializeDefaultAdmin } from './init/defaultUser';
import './db/database'; // Initialize database

// Load environment variables
dotenv.config();

// Initialize default admin user
initializeDefaultAdmin();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AppSec Agent API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/code-review', codeReviewRoutes);
app.use('/api/threat-modeling', threatModelingRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});

