import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { errorHandler, requestLogger, rateLimiter } from './middleware';
import { authenticate, requireAdmin } from './middleware/auth';
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
  excelRoutes,
  clinicalPathologyRoutes,
  userCodeRoutes,
  paymentScheduleRoutes,
  pushRoutes,
  unifiedCustomerRoutes,
  customerTagRoutes,
  customerNoteRoutes,
  customerDocumentRoutes,
  customerHealthScoreRoutes,
  customerAuditLogRoutes,
  dataQualityRoutes,
  filterPresetRoutes,
  customFieldRoutes,
  customerAnalyticsRoutes,
  customerImportExportRoutes,
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
import searchRoutes from './routes/search';
import toxicityV2Routes from './routes/toxicityV2';
import studyDocumentRoutes from './routes/studyDocuments';
import automationSchedulerRoutes from './routes/automationScheduler';
import scheduledBackupRoutes from './routes/scheduledBackup';
import { pipelineInitializationService } from './services/pipelineInitializationService';
import { syncReleaseNotes } from './services/releaseNoteService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration — 다중 origin 지원 (웹/모바일/프리뷰)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // 서버 간 요청(origin 없음) 또는 허용된 origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
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

// Swagger API documentation (개발 환경에서만)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

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
app.use('/api/excel', excelRoutes);

// Clinical Pathology routes
app.use('/api/clinical-pathology', clinicalPathologyRoutes);

// User Code routes
app.use('/api/user-code', userCodeRoutes);

// User Settings routes (for user code save endpoint)
app.use('/api/user-settings', userCodeRoutes);

// Search routes
app.use('/api/search', searchRoutes);

// Payment Schedule routes
app.use('/api/payment-schedules', paymentScheduleRoutes);

// Push Notification routes
app.use('/api/push', pushRoutes);

// Unified Customer routes
app.use('/api/unified-customers', unifiedCustomerRoutes);

// CRM Customer Management Extension routes
app.use('/api/customer-tags', customerTagRoutes);
app.use('/api/customer-notes', customerNoteRoutes);
app.use('/api/customer-documents', customerDocumentRoutes);
app.use('/api/customer-health', customerHealthScoreRoutes);
app.use('/api/customer-audit', customerAuditLogRoutes);
app.use('/api/data-quality', dataQualityRoutes);
app.use('/api/filter-presets', filterPresetRoutes);
app.use('/api/custom-fields', customFieldRoutes);
app.use('/api/customer-analytics', customerAnalyticsRoutes);

// Customer Import/Export routes
app.use('/api/customer-import-export', customerImportExportRoutes);

// Toxicity V2 routes
app.use('/api/toxicity-v2', toxicityV2Routes);

// Study Document routes
app.use('/api', studyDocumentRoutes);

// Scheduled automation & backup routes (external cron)
app.use('/api/admin/automation', automationSchedulerRoutes);
app.use('/api/admin/backups', scheduledBackupRoutes);

// Static file serving for exports (인증 필요)
app.use('/exports', authenticate, requireAdmin, express.static(path.join(process.cwd(), 'exports')));

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  
  // 파이프라인 자동 초기화
  try {
    const isInitialized = await pipelineInitializationService.isInitialized();
    if (!isInitialized) {
      console.log('🔧 Initializing default pipeline stages...');
      await pipelineInitializationService.initializeDefaultStages();
      console.log('✅ Pipeline stages initialized successfully');
    } else {
      console.log('✅ Pipeline stages already initialized');
    }
  } catch (error) {
    console.error('❌ Failed to initialize pipeline stages:', error);
  }

  // 릴리즈 노트 → 공지사항 자동 동기화
  try {
    await syncReleaseNotes();
  } catch (error) {
    console.error('❌ Failed to sync release notes:', error);
  }
});

export default app;
