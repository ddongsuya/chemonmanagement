import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { errorHandler, requestLogger, rateLimiter } from './middleware';
import { 
  authRoutes, 
  quotationRoutes, 
  customerRoutes, 
  adminRoutes, 
  announcementRoutes, 
  notificationRoutes,
  leadRoutes,
  pipelineRoutes,
  contractRoutes,
  studyRoutes,
  consultationRoutes,
  customerDataRoutes,
} from './routes';
import masterDataRoutes from './routes/masterData';
import packageRoutes from './routes/package';
import kanbanRoutes from './routes/kanban';
import activitiesRoutes from './routes/activities';
import dashboardRoutes from './routes/dashboard';
import analyticsRoutes from './routes/analytics';
import automationRoutes from './routes/automation';
import reportsRoutes from './routes/reports';
import studyDashboardRoutes from './routes/studyDashboard';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting middleware
app.use(rateLimiter());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/master', masterDataRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/studies', studyRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/customer-data', customerDataRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/company', packageRoutes);
app.use('/api/settings', packageRoutes);

// CRM Extension routes
app.use('/api/kanban', kanbanRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/study-dashboard', studyDashboardRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
});

export default app;
