// backend/src/modules/integrations/tools/integration-tools.ts
/**
 * AI Agent Integration Tools.
 *
 * Wraps integration providers and methods into executable tools registered
 * with the AI Agent Engine, enforcing role-based execution constraints.
 */
import { ForbiddenError } from '@common/errors';
import { prisma } from '@database/index';
import { messagingAdapter, calendarAdapter, paymentAdapter } from '../providers/adapters';
import { logger } from '@shared/logger';

export interface ToolDefinition {
  name: string;
  description: string;
  allowedEmployeeTypes: string[]; // Role-based permission constraint
  execute(workspaceId: string, params: any): Promise<any>;
}

export const checkCalendarAvailabilityTool: ToolDefinition = {
  name: 'check_calendar_availability',
  description: 'Checks if a given date and time range is free on the calendar.',
  allowedEmployeeTypes: ['RECEPTIONIST'], // Receptionist strictly owns scheduling
  async execute(workspaceId: string, params: { from: string; to: string; calendarId?: string }): Promise<any> {
    const from = new Date(params.from);
    const to = new Date(params.to);
    const slots = await calendarAdapter.getBusySlots(
      workspaceId,
      from,
      to,
      params.calendarId,
    );
    return { available: slots.length === 0, busySlots: slots };
  },
};

export const bookCalendarAppointmentTool: ToolDefinition = {
  name: 'book_calendar_appointment',
  description: 'Books an appointment at a specific time on the calendar.',
  allowedEmployeeTypes: ['RECEPTIONIST'], // Receptionist strictly owns scheduling
  async execute(
    workspaceId: string,
    params: {
      title: string;
      description?: string;
      start: string;
      end: string;
      attendeeEmails?: string[];
      bufferMinutes?: number;
      calendarId?: string;
      customerId?: string;
      aiEmployeeId?: string;
    },
  ): Promise<any> {
    const start = new Date(params.start);
    const end = new Date(params.end);

    let customerId = params.customerId;
    if (!customerId) {
      const defaultCustomer = await prisma.customer.findFirst({
        where: { workspaceId, deletedAt: null },
      });
      if (defaultCustomer) {
        customerId = defaultCustomer.id;
      } else {
        const newCust = await prisma.customer.create({
          data: {
            workspaceId,
            name: 'Booking Guest',
            sourceChannel: 'RECEPTIONIST',
          },
        });
        customerId = newCust.id;
      }
    }

    let aiEmployeeId = params.aiEmployeeId;
    if (!aiEmployeeId) {
      const activeEmployee = await prisma.aIEmployee.findFirst({
        where: { workspaceId, employeeType: 'RECEPTIONIST', deletedAt: null },
      });
      if (activeEmployee) {
        aiEmployeeId = activeEmployee.id;
      } else {
        throw new Error('No active Receptionist AI Employee found in workspace to book appointment');
      }
    }

    const event = await calendarAdapter.bookAppointment(workspaceId, {
      customerId,
      aiEmployeeId,
      title: params.title,
      description: params.description,
      start,
      end,
      attendeeEmails: params.attendeeEmails,
      bufferMinutes: params.bufferMinutes,
      calendarId: params.calendarId,
    });
    return event;
  },
};

export const sendWhatsAppMessageTool: ToolDefinition = {
  name: 'send_whatsapp_message',
  description: 'Sends an outbound WhatsApp text or media message to a customer.',
  allowedEmployeeTypes: ['SALES', 'SUPPORT', 'FOLLOWUP'],
  async execute(
    workspaceId: string,
    params: { to: string; text?: string; mediaType?: 'image' | 'document' | 'audio' | 'video'; mediaUrl?: string; caption?: string },
  ): Promise<any> {
    if (params.mediaType && params.mediaUrl) {
      const messageId = await messagingAdapter.sendMedia(
        workspaceId,
        params.to,
        params.mediaType,
        params.mediaUrl,
        params.caption,
      );
      return { success: true, messageId };
    } else if (params.text) {
      const messageId = await messagingAdapter.sendMessage(workspaceId, params.to, params.text);
      return { success: true, messageId };
    }
    throw new Error('Either text or media details must be specified');
  },
};

export const sendEmailFollowupTool: ToolDefinition = {
  name: 'send_email_followup',
  description: 'Sends an email to a customer with standard or HTML formatting.',
  allowedEmployeeTypes: ['SALES', 'SUPPORT', 'FOLLOWUP'],
  async execute(
    workspaceId: string,
    params: { to: string; subject: string; html: string; text?: string; inReplyTo?: string; references?: string },
  ): Promise<any> {
    await messagingAdapter.sendEmail(workspaceId, {
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      inReplyTo: params.inReplyTo,
      references: params.references,
    });
    return { success: true };
  },
};

export const fetchOrderStatusTool: ToolDefinition = {
  name: 'fetch_order_status',
  description: 'Safely looks up Stripe payment or order details using order ID or customer email.',
  allowedEmployeeTypes: ['SUPPORT', 'SALES'], // AI Support and Sales agents can verify status
  async execute(workspaceId: string, params: { orderIdOrEmail: string }): Promise<any> {
    const status = await paymentAdapter.getOrderStatus(workspaceId, params.orderIdOrEmail);
    if (!status) return { found: false };
    return { found: true, order: status };
  },
};

export const integrationToolsRegistry = new Map<string, ToolDefinition>([
  [checkCalendarAvailabilityTool.name, checkCalendarAvailabilityTool],
  [bookCalendarAppointmentTool.name, bookCalendarAppointmentTool],
  [sendWhatsAppMessageTool.name, sendWhatsAppMessageTool],
  [sendEmailFollowupTool.name, sendEmailFollowupTool],
  [fetchOrderStatusTool.name, fetchOrderStatusTool],
]);

/**
 * Main execution dispatch helper. Resolves tool, validates role-based permissions,
 * and runs execution securely.
 */
export async function executeAgentTool(
  workspaceId: string,
  employeeType: string, // receptionist, sales, support, followup
  toolName: string,
  params: any,
): Promise<any> {
  const tool = integrationToolsRegistry.get(toolName);
  if (!tool) {
    throw new Error(`Tool ${toolName} not found in integrations registry`);
  }

  // Normalise employeeType to uppercase matching registry format
  const normType = employeeType.toUpperCase();

  if (!tool.allowedEmployeeTypes.includes(normType)) {
    logger.warn({ toolName, employeeType, workspaceId }, 'AI Agent tool execution forbidden due to role constraints');
    throw new ForbiddenError(
      `AI Employee role '${employeeType}' is not permitted to execute tool '${toolName}'`,
    );
  }

  return tool.execute(workspaceId, params);
}
