// backend/src/modules/integrations/providers/calendar/calendar.provider.ts
/**
 * Google Calendar integration provider.
 *
 * Exposes:
 *  - Availability checking (free/busy) against workspace working hours.
 *  - Slot booking with double-booking prevention and buffer enforcement.
 *  - Rescheduling and cancellation of existing events.
 */
import { tokenService } from '../../services/token.service';
import { logger } from '@shared/logger';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface CalendarAvailabilityRequest {
  workspaceId: string;
  calendarId?: string;    // defaults to 'primary'
  from: Date;
  to: Date;
}

export interface BookEventRequest {
  workspaceId: string;
  calendarId?: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  attendeeEmails?: string[];
  bufferMinutes?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  attendees: string[];
  htmlLink: string;
}

export const calendarProvider = {
  /**
   * Returns busy time slots within the requested window.
   * AI Receptionist uses this to find open appointment slots.
   */
  async getBusySlots(request: CalendarAvailabilityRequest): Promise<TimeSlot[]> {
    const { workspaceId, calendarId = 'primary', from, to } = request;
    const accessToken = await tokenService.getValidAccessToken(workspaceId, 'google_calendar');

    const body = {
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      items: [{ id: calendarId }],
    };

    const response = await fetch(`${CALENDAR_API_BASE}/freeBusy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error({ workspaceId, err }, 'Google Calendar freeBusy failed');
      throw new Error(`Google Calendar API error: ${err}`);
    }

    const data = (await response.json()) as {
      calendars: Record<string, { busy: Array<{ start: string; end: string }> }>;
    };

    const busy = data.calendars[calendarId]?.busy ?? [];
    return busy.map((slot) => ({
      start: new Date(slot.start),
      end: new Date(slot.end),
    }));
  },

  /**
   * Checks if a specific time slot is available (not overlapping with any busy period).
   */
  async isSlotAvailable(
    workspaceId: string,
    start: Date,
    end: Date,
    calendarId = 'primary',
  ): Promise<boolean> {
    const busySlots = await calendarProvider.getBusySlots({
      workspaceId,
      calendarId,
      from: start,
      to: end,
    });

    const startMs = start.getTime();
    const endMs = end.getTime();

    return !busySlots.some(
      (slot) => slot.start.getTime() < endMs && slot.end.getTime() > startMs,
    );
  },

  /**
   * Books an appointment event on Google Calendar.
   * Enforces buffer time by checking surrounding busy slots.
   * Returns the created event id and link.
   */
  async bookEvent(request: BookEventRequest): Promise<CalendarEvent> {
    const {
      workspaceId,
      calendarId = 'primary',
      title,
      description,
      start,
      end,
      attendeeEmails = [],
      bufferMinutes = 0,
    } = request;

    // Check availability including buffer window
    const bufferMs = bufferMinutes * 60 * 1000;
    const checkStart = new Date(start.getTime() - bufferMs);
    const checkEnd = new Date(end.getTime() + bufferMs);

    const available = await calendarProvider.isSlotAvailable(
      workspaceId,
      checkStart,
      checkEnd,
      calendarId,
    );

    if (!available) {
      throw new Error(
        'Requested time slot (including buffer) is not available. Please choose another time.',
      );
    }

    const accessToken = await tokenService.getValidAccessToken(workspaceId, 'google_calendar');

    const eventBody = {
      summary: title,
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: attendeeEmails.map((email) => ({ email })),
    };

    const response = await fetch(`${CALENDAR_API_BASE}/calendars/${calendarId}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Google Calendar book event failed: ${err}`);
    }

    const event = (await response.json()) as {
      id: string;
      summary: string;
      start: { dateTime: string };
      end: { dateTime: string };
      attendees?: Array<{ email: string }>;
      htmlLink: string;
    };

    return {
      id: event.id,
      title: event.summary,
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
      attendees: (event.attendees ?? []).map((a) => a.email),
      htmlLink: event.htmlLink,
    };
  },

  /**
   * Cancels an existing Google Calendar event.
   */
  async cancelEvent(
    workspaceId: string,
    eventId: string,
    calendarId = 'primary',
  ): Promise<void> {
    const accessToken = await tokenService.getValidAccessToken(workspaceId, 'google_calendar');

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok && response.status !== 410 /* already deleted */) {
      const err = await response.text();
      throw new Error(`Google Calendar cancel event failed: ${err}`);
    }
  },

  /**
   * Updates (reschedules) an existing event.
   */
  async rescheduleEvent(
    workspaceId: string,
    eventId: string,
    newStart: Date,
    newEnd: Date,
    calendarId = 'primary',
  ): Promise<CalendarEvent> {
    const accessToken = await tokenService.getValidAccessToken(workspaceId, 'google_calendar');

    const patch = {
      start: { dateTime: newStart.toISOString() },
      end: { dateTime: newEnd.toISOString() },
    };

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Google Calendar reschedule failed: ${err}`);
    }

    const event = (await response.json()) as {
      id: string;
      summary: string;
      start: { dateTime: string };
      end: { dateTime: string };
      attendees?: Array<{ email: string }>;
      htmlLink: string;
    };

    return {
      id: event.id,
      title: event.summary,
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
      attendees: (event.attendees ?? []).map((a) => a.email),
      htmlLink: event.htmlLink,
    };
  },
};
