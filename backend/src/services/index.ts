export { AuthService, default as authService } from './authService';
export { DataService, default as dataService } from './dataService';
export { AdminService, default as adminService } from './adminService';
export { AnnouncementService, default as announcementService } from './announcementService';
export { NotificationService, default as notificationService } from './notificationService';
export { SettingsService, default as settingsService } from './settingsService';
export { BackupService, default as backupService } from './backupService';

// CRM Extension services
export { KanbanService, kanbanService } from './kanbanService';
export { ActivityService, activityService } from './activityService';
export { DashboardService, dashboardService } from './dashboardService';
export { AnalyticsService, analyticsService } from './analyticsService';

// Pipeline Automation services
export { PipelineAutomationService, pipelineAutomationService } from './pipelineAutomationService';

// Pipeline Initialization services
export { PipelineInitializationService, pipelineInitializationService, DEFAULT_STAGES } from './pipelineInitializationService';
export type { DefaultTask } from './pipelineInitializationService';

// Lead Conversion services
export { LeadConversionService, leadConversionService } from './leadConversionService';

// User Code Validation services
export { UserCodeValidator } from './userCodeValidator';
export type { ValidationResult } from './userCodeValidator';

// Lead Number services
export { LeadNumberService, leadNumberService, UserCodeNotSetError } from './leadNumberService';
export type { LeadNumberConfig } from './leadNumberService';

// Payment Schedule services
export { PaymentScheduleService, paymentScheduleService } from './paymentScheduleService';
export type { PaymentStatus, CreatePaymentScheduleDTO, PaymentSummary } from './paymentScheduleService';

// Push Notification services
export { PushService } from './pushService';
export type { PushNotificationPayload, SendPushResult } from './pushService';
