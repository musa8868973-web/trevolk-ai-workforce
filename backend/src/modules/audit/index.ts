// backend/src/modules/audit/index.ts
export { auditLogRoutes } from './routes/audit-log.routes';
export { auditLogService, type RecordAuditLogInput } from './services/audit-log.service';
export { auditLogController } from './controller/audit-log.controller';
export * from './validators/audit-log.schema';
