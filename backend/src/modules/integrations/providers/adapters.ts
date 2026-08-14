// backend/src/modules/integrations/providers/adapters.ts
/**
 * Unified Abstraction Adapters.
 *
 * Implements the Provider Abstraction Pattern.
 * All AI Employee tools and business domains interact solely with these
 * adapters rather than directly importing low-level integration clients or SDKs.
 */
import { prisma } from '@database/index';
import { logger } from '@shared/logger';
import { enqueueJob, QUEUE_NAMES } from '@common/queues/queue.factory';
import { credentialService } from '../services/credential.service';
import type { EmailMessage } from './email/email.provider';
import { calendarProvider, type TimeSlot } from './calendar/calendar.provider';
import { stripeProvider } from './stripe/stripe.provider';
import { appointmentService } from '@modules/appointments/services/appointment.service';

/** Check if a given start/end time window falls within workspace business hours. */
export async function checkWorkingHours(
  workspaceId: string,
  start: Date,
  end: Date,
): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // Fallback default: Mon-Fri (1-5), 09:00 - 17:00
  let workingHours = { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] };
  if (workspace.defaultWorkingHours) {
    try {
      workingHours = JSON.parse(workspace.defaultWorkingHours);
    } catch (e) {
      logger.warn({ workspaceId }, 'Failed to parse defaultWorkingHours; using fallback business hours');
    }
  }

  const timezone = workspace.timezone || 'UTC';

  const getLocalDetails = (date: Date, tz: string) => {
    // Convert UTC Date to workspace timezone representation
    const tzDateStr = date.toLocaleString('en-US', { timeZone: tz });
    const tzDate = new Date(tzDateStr);
    const dayOfWeek = tzDate.getDay(); // 0 (Sun) - 6 (Sat)
    const hours = tzDate.getHours().toString().padStart(2, '0');
    const minutes = tzDate.getMinutes().toString().padStart(2, '0');
    return { dayOfWeek, timeVal: `${hours}:${minutes}` };
  };

  const startDetails = getLocalDetails(start, timezone);
  const endDetails = getLocalDetails(end, timezone);

  // Validate working days
  if (!workingHours.days.includes(startDetails.dayOfWeek) || !workingHours.days.includes(endDetails.dayOfWeek)) {
    return false;
  }

  // Validate working hours window
  if (startDetails.timeVal < workingHours.start || startDetails.timeVal > workingHours.end) {
    return false;
  }
  if (endDetails.timeVal < workingHours.start || endDetails.timeVal > workingHours.end) {
    return false;
  }

  return true;
}

export const messagingAdapter = {
  /** Queue outbound text message */
  async sendMessage(workspaceId: string, to: string, text: string): Promise<string> {
    const integration = await credentialService.findIntegration(workspaceId, 'whatsapp');
    if (!integration || integration.status !== 'CONNECTED') {
      throw new Error('WhatsApp integration not connected');
    }

    await enqueueJob(QUEUE_NAMES.WHATSAPP_SEND, 'whatsapp:send', {
      workspaceId,
      to,
      text,
    });

    return 'queued';
  },

  /** Queue outbound media message */
  async sendMedia(
    workspaceId: string,
    to: string,
    mediaType: 'image' | 'document' | 'audio' | 'video',
    mediaUrl: string,
    caption?: string,
  ): Promise<string> {
    const integration = await credentialService.findIntegration(workspaceId, 'whatsapp');
    if (!integration || integration.status !== 'CONNECTED') {
      throw new Error('WhatsApp integration not connected');
    }

    await enqueueJob(QUEUE_NAMES.WHATSAPP_SEND, 'whatsapp:send', {
      workspaceId,
      to,
      mediaType,
      mediaUrl,
      caption,
    });

    return 'queued';
  },

  /** Queue outbound email message (Gmail OAuth or SMTP) */
  async sendEmail(workspaceId: string, message: EmailMessage): Promise<void> {
    const integration = await credentialService.findIntegration(workspaceId, 'gmail');
    if (!integration || integration.status !== 'CONNECTED') {
      throw new Error('Email integration not configured for this workspace');
    }

    await enqueueJob(QUEUE_NAMES.EMAIL_SEND, 'email:send', {
      workspaceId,
      message,
    });
  },
};

export const calendarAdapter = {
  /** Fetch overlapping busy slots across both the local database and external Google Calendar (if integrated) */
  async getBusySlots(
    workspaceId: string,
    from: Date,
    to: Date,
    calendarId = 'primary',
  ): Promise<TimeSlot[]> {
    const busySlots: TimeSlot[] = [];

    const localAppointments = await prisma.appointment.findMany({
      where: {
        workspaceId,
        deletedAt: null,
      },
    });

    for (const app of localAppointments) {
      if (app.status === 'CANCELLED' || app.status === 'NO_SHOW') continue;
      
      const startMs = new Date(app.startTime).getTime();
      const endMs = new Date(app.endTime).getTime();
      if (startMs <= to.getTime() && endMs >= from.getTime()) {
        busySlots.push({ start: new Date(startMs), end: new Date(endMs) });
      }
    }

    // 2. Google Calendar
    try {
      const integration = await credentialService.findIntegration(workspaceId, 'google_calendar');
      if (integration && integration.status === 'CONNECTED') {
        const googleBusy = await calendarProvider.getBusySlots({
          workspaceId,
          calendarId,
          from,
          to,
        });
        busySlots.push(...googleBusy);
      }
    } catch (err) {
      logger.error({ err, workspaceId }, 'Failed to fetch busy slots from Google Calendar; falling back to local');
    }

    return busySlots;
  },

  /** Verify slot availability by checking working hours, buffer windows, and overlap on both DB and Google Calendar */
  async isSlotAvailable(
    workspaceId: string,
    start: Date,
    end: Date,
    bufferMinutes = 0,
    calendarId = 'primary',
  ): Promise<boolean> {
    // 1. Workspace Working Hours check
    const isWithinHours = await checkWorkingHours(workspaceId, start, end);
    if (!isWithinHours) {
      logger.info({ workspaceId, start, end }, 'Availability check failed: slot falls outside business hours');
      return false;
    }

    // 2. Apply buffer time window around the check slot
    const bufferMs = bufferMinutes * 60 * 1000;
    const checkStart = new Date(start.getTime() - bufferMs);
    const checkEnd = new Date(end.getTime() + bufferMs);

    // 3. Query all busy slots
    const busySlots = await this.getBusySlots(workspaceId, checkStart, checkEnd, calendarId);

    const checkStartMs = checkStart.getTime();
    const checkEndMs = checkEnd.getTime();

    // Check if the requested slot overlaps with any busy period
    const hasOverlap = busySlots.some(
      (slot) => slot.start.getTime() < checkEndMs && slot.end.getTime() > checkStartMs,
    );

    return !hasOverlap;
  },

  /** Books an appointment. Overlapping/double-booking check and buffer checks are mandatory. */
  async bookAppointment(
    workspaceId: string,
    input: {
      customerId: string;
      aiEmployeeId: string;
      leadId?: string;
      title: string;
      description?: string;
      start: Date;
      end: Date;
      attendeeEmails?: string[];
      bufferMinutes?: number;
      calendarId?: string;
    },
  ): Promise<any> {
    const {
      customerId,
      aiEmployeeId,
      leadId,
      title,
      description,
      start,
      end,
      attendeeEmails = [],
      bufferMinutes = 0,
      calendarId = 'primary',
    } = input;

    // Enforce overlapping availability checks before confirming booking
    const available = await this.isSlotAvailable(
      workspaceId,
      start,
      end,
      bufferMinutes,
      calendarId,
    );

    if (!available) {
      throw new Error('Requested time slot (including buffer/working hours) is not available.');
    }

    let externalCalendarRef: string | null = null;
    let googleEvent: any = null;

    // Book on Google Calendar if integrated
    try {
      const integration = await credentialService.findIntegration(workspaceId, 'google_calendar');
      if (integration && integration.status === 'CONNECTED') {
        googleEvent = await calendarProvider.bookEvent({
          workspaceId,
          calendarId,
          title,
          description,
          start,
          end,
          attendeeEmails,
          bufferMinutes,
        });
        externalCalendarRef = googleEvent.id;
      }
    } catch (err) {
      logger.error({ err, workspaceId }, 'Google Calendar booking failed; creating local appointment only');
    }

    // Persist in local database
    const appointment = await appointmentService.createAppointment(workspaceId, {
      customerId,
      aiEmployeeId,
      leadId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      externalCalendarRef,
      integrationId: googleEvent ? (await prisma.integration.findUnique({
        where: { workspaceId_provider: { workspaceId, provider: 'google_calendar' } },
      }))?.id : null,
    });

    return appointment;
  },

  /** Cancels an appointment locally and externally on Google Calendar */
  async cancelAppointment(
    workspaceId: string,
    appointmentId: string,
    calendarId = 'primary',
  ): Promise<void> {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, workspaceId, deletedAt: null },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.externalCalendarRef) {
      try {
        const integration = await credentialService.findIntegration(workspaceId, 'google_calendar');
        if (integration && integration.status === 'CONNECTED') {
          await calendarProvider.cancelEvent(workspaceId, appointment.externalCalendarRef, calendarId);
        }
      } catch (err) {
        logger.error({ err, workspaceId }, 'Google Calendar event cancellation failed');
      }
    }

    await appointmentService.cancelAppointment(workspaceId, appointmentId);
  },

  /** Reschedules an existing appointment, validating the new slot availability first */
  async rescheduleAppointment(
    workspaceId: string,
    appointmentId: string,
    newStart: Date,
    newEnd: Date,
    calendarId = 'primary',
  ): Promise<any> {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, workspaceId, deletedAt: null },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Availability validation is mandatory before rescheduling
    const available = await this.isSlotAvailable(workspaceId, newStart, newEnd, 0, calendarId);
    if (!available) {
      throw new Error('Requested new time slot is not available.');
    }

    if (appointment.externalCalendarRef) {
      try {
        const integration = await credentialService.findIntegration(workspaceId, 'google_calendar');
        if (integration && integration.status === 'CONNECTED') {
          await calendarProvider.rescheduleEvent(
            workspaceId,
            appointment.externalCalendarRef,
            newStart,
            newEnd,
            calendarId,
          );
        }
      } catch (err) {
        logger.error({ err, workspaceId }, 'Google Calendar reschedule failed');
      }
    }

    return appointmentService.updateAppointment(workspaceId, appointmentId, {
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
    });
  },
};

export const paymentAdapter = {
  /** Safe lookup helper to verify customer subscriptions */
  async getSubscriptionStatus(workspaceId: string, customerIdOrEmail: string): Promise<any> {
    const integration = await credentialService.findIntegration(workspaceId, 'stripe');
    if (!integration || integration.status !== 'CONNECTED') {
      throw new Error('Stripe integration not connected');
    }
    return stripeProvider.getSubscriptionStatus(workspaceId, customerIdOrEmail);
  },

  /** Safe lookup helper to check status of recent orders/charges */
  async getOrderStatus(workspaceId: string, orderIdOrEmail: string): Promise<any> {
    const integration = await credentialService.findIntegration(workspaceId, 'stripe');
    if (!integration || integration.status !== 'CONNECTED') {
      throw new Error('Stripe integration not connected');
    }
    return stripeProvider.getOrderStatus(workspaceId, orderIdOrEmail);
  },
};
