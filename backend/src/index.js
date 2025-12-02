import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import taskRoutes from './routes/taskRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Main application entry point.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.io setup for real-time updates
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean),
    methods: ['GET', 'POST']
  }
});

// Make io available to routes via app.locals
app.locals.io = io;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Only use morgan in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve static files in production (frontend build)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../public')));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/tasks', taskRoutes);

// Serve frontend for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../public/index.html'));
  });
}

// 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   Task Management API                                  ║
║   Running on http://localhost:${PORT}                     ║
║                                                        ║
║   Endpoints:                                           ║
║   • GET    /api/tasks          - List all tasks        ║
║   • GET    /api/tasks/:id      - Get task by ID        ║
║   • POST   /api/tasks          - Create task           ║
║   • PUT    /api/tasks/:id      - Update task           ║
║   • DELETE /api/tasks/:id      - Delete task           ║
║   • GET    /api/tasks/stats    - Get statistics        ║
║   • POST   /api/tasks/bulk-delete - Bulk delete        ║
║   • PATCH  /api/tasks/bulk-status - Bulk status update ║
║   • GET    /api/tasks/export   - Export tasks          ║
║   • GET    /health             - Health check          ║
║                                                        ║
║   WebSocket: Enabled for real-time updates             ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);
  });
}

export { io };
export default app;
