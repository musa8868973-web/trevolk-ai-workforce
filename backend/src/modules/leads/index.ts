// backend/src/modules/leads/index.ts
export { leadRoutes } from './routes/lead.routes';
export { leadService } from './services/lead.service';
export { toSafeLead, type SafeLead } from './mappers/lead.mapper';
export * from './types';
