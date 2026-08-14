// backend/src/modules/customers/index.ts
export { customerRoutes } from './routes/customer.routes';
export { customerService } from './services/customer.service';
export { toSafeCustomer, type SafeCustomer } from './mappers/customer.mapper';
