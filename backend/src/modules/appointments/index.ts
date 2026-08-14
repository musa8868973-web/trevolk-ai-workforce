// backend/src/modules/appointments/index.ts
export { appointmentRoutes } from './routes/appointment.routes';
export { appointmentService } from './services/appointment.service';
export { toSafeAppointment, type SafeAppointment } from './mappers/appointment.mapper';
export * from './validators/appointment.schema';
