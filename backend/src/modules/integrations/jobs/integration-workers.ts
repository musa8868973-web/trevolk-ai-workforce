// backend/src/modules/integrations/jobs/integration-workers.ts
/**
 * BullMQ Worker Initialisers for Integration background processing.
 *
 * Responsibilities:
 *  - Listen to queues (e.g. WHATSAPP_SEND, EMAIL_SEND, WHATSAPP_INBOUND, STRIPE_WEBHOOK, GENERIC_WEBHOOK).
 *  - Perform token validation/renewal automatically before executing API calls.
 *  - Process Stripe webhook logic or generic webhook triggers asynchronously.
 */
import { getRedisConnection } from '@common/queues/redis.client';
import { QUEUE_NAMES } from '@common/queues/queue.factory';
import { whatsAppProvider } from '../providers/whatsapp/whatsapp.provider';
import { emailProvider, type EmailMessage } from '../providers/email/email.provider';
import { logger } from '@shared/logger';
import { prisma } from '@database/index';
import { webhookEventService } from '../services/webhook-event.service';
import { credentialService } from '../services/credential.service';
import { messagingAdapter, calendarAdapter } from '../providers/adapters';
import { supportEmployeeService } from '@modules/support-employee/services/support-employee.service';
import { salesEmployeeService } from '@modules/sales-employee/services/sales-employee.service';
import { followupEmployeeService } from '@modules/followup-employee/services/followup-employee.service';

let _workers: any[] = [];

/**
 * Triggers AI Employee response turn.
 * Priority: 1. already assigned to conversation, 2. Receptionist, 3. Support, 4. Sales
 */
async function triggerAIEmployeeWhatsAppResponse(
  workspaceId: string,
  conversationId: string,
  customerId: string,
  customerPhone: string,
  messageText: string,
): Promise<void> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) return;

  let employee = null;
  if (conversation.aiEmployeeId) {
    employee = await prisma.aIEmployee.findFirst({
      where: { id: conversation.aiEmployeeId, workspaceId, status: 'ACTIVE', deletedAt: null },
    });
  }

  if (!employee) {
    // Look for active RECEPTIONIST
    employee = await prisma.aIEmployee.findFirst({
      where: { workspaceId, employeeType: 'RECEPTIONIST', status: 'ACTIVE', deletedAt: null },
    });
  }
  if (!employee) {
    // Look for active SUPPORT
    employee = await prisma.aIEmployee.findFirst({
      where: { workspaceId, employeeType: 'SUPPORT', status: 'ACTIVE', deletedAt: null },
    });
  }
  if (!employee) {
    // Look for active SALES
    employee = await prisma.aIEmployee.findFirst({
      where: { workspaceId, employeeType: 'SALES', status: 'ACTIVE', deletedAt: null },
    });
  }

  if (!employee) {
    logger.info({ workspaceId, conversationId }, 'No active AI Employee found to respond to WhatsApp message');
    return;
  }

  // Update conversation with assigned employee
  if (conversation.aiEmployeeId !== employee.id) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { aiEmployeeId: employee.id },
    });
  }

  let replyText = '';

  if (employee.employeeType === 'SUPPORT') {
    // Support AI Employee: Answer FAQ
    const faqResult = await supportEmployeeService.answerFaq(workspaceId, { question: messageText });
    replyText = faqResult.answer;

    // Save AI response message
    await prisma.message.create({
      data: {
        conversationId,
        senderType: 'AI_EMPLOYEE',
        senderId: employee.id,
        content: replyText,
        messageType: 'TEXT',
      },
    });

    // Send WhatsApp outbound
    await messagingAdapter.sendMessage(workspaceId, customerPhone, replyText);

    // If escalation recommended
    if (faqResult.escalationRecommended) {
      await supportEmployeeService.handleEscalation(workspaceId, {
        conversationId,
        reason: 'Grounded knowledge FAQ not found',
      });
    }
  } else if (employee.employeeType === 'RECEPTIONIST') {
    // Receptionist AI Employee: Schedule appointments and check availability
    const textLower = messageText.toLowerCase();

    if (textLower.includes('book') || textLower.includes('schedule') || textLower.includes('appointment')) {
      // Look for a date in text (e.g., check if text contains something like YYYY-MM-DD)
      const dateRegex = /\d{4}-\d{2}-\d{2}/;
      const match = messageText.match(dateRegex);

      if (match) {
        const dateStr = match[0];
        // Parse time or default to 10:00 AM
        let timeStr = '10:00';
        const timeRegex = /\d{2}:\d{2}/;
        const timeMatch = messageText.match(timeRegex);
        if (timeMatch) timeStr = timeMatch[0];

        const start = new Date(`${dateStr}T${timeStr}:00`);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

        try {
          const available = await calendarAdapter.isSlotAvailable(workspaceId, start, end);
          if (available) {
            await calendarAdapter.bookAppointment(workspaceId, {
              customerId,
              aiEmployeeId: employee.id,
              title: `Appointment with Receptionist`,
              start,
              end,
            });
            replyText = `Awesome! I have booked your appointment on ${dateStr} from ${timeStr} to ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}.`;
          } else {
            replyText = `I am sorry, but the slot on ${dateStr} at ${timeStr} is not available. Please pick another time.`;
          }
        } catch (e: any) {
          replyText = `I ran into an issue booking that slot: ${e.message}. Please pick another time.`;
        }
      } else {
        replyText = `I can help you book an appointment! Please tell me your preferred date and time (e.g. "book 2026-08-15 at 14:00").`;
      }
    } else {
      replyText = `Hello! I am the Front Desk AI Receptionist. How can I help you today? I can check calendar availability or book appointments.`;
    }

    // Save AI response message
    await prisma.message.create({
      data: {
        conversationId,
        senderType: 'AI_EMPLOYEE',
        senderId: employee.id,
        content: replyText,
        messageType: 'TEXT',
      },
    });

    // Send WhatsApp outbound
    await messagingAdapter.sendMessage(workspaceId, customerPhone, replyText);
  } else {
    // Fallback: Sales or generic AI reply
    replyText = `Hello! Thank you for your message. This is our automated assistant. How can I help you today?`;

    // Save AI response message
    await prisma.message.create({
      data: {
        conversationId,
        senderType: 'AI_EMPLOYEE',
        senderId: employee.id,
        content: replyText,
        messageType: 'TEXT',
      },
    });

    // Send WhatsApp outbound
    await messagingAdapter.sendMessage(workspaceId, customerPhone, replyText);
  }

  // Update last message timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });
}

export function initializeIntegrationWorkers(): void {
  // If Redis is not configured, we do not start workers
  if (!process.env['REDIS_URL']) {
    logger.info('Redis not configured. Skipping background queue workers initialization.');
    return;
  }

  try {
    // Lazy load BullMQ
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Worker } = require('bullmq') as typeof import('bullmq');
    const connection = getRedisConnection();

    // 1. WhatsApp Message Sender Worker
    const whatsappWorker = new Worker(
      QUEUE_NAMES.WHATSAPP_SEND,
      async (job: any) => {
        const { workspaceId, to, text, mediaType, mediaUrl, caption } = job.data as {
          workspaceId: string;
          to: string;
          text?: string;
          mediaType?: 'image' | 'document' | 'audio' | 'video';
          mediaUrl?: string;
          caption?: string;
        };

        logger.info({ jobId: job.id, workspaceId, to }, 'Processing WhatsApp send job');

        if (mediaType && mediaUrl) {
          await whatsAppProvider.sendMedia(workspaceId, to, mediaType, mediaUrl, caption);
        } else if (text) {
          await whatsAppProvider.sendText(workspaceId, to, text);
        }
      },
      { connection },
    );

    // 2. Email Sender Worker (Gmail/SMTP)
    const emailWorker = new Worker(
      QUEUE_NAMES.EMAIL_SEND,
      async (job: any) => {
        const { workspaceId, message } = job.data as {
          workspaceId: string;
          message: EmailMessage;
        };

        logger.info({ jobId: job.id, workspaceId, to: message.to }, 'Processing Email send job');

        await emailProvider.sendEmail(workspaceId, message);
      },
      { connection },
    );

    // 3. WhatsApp Message Inbound Worker
    const whatsappInboundWorker = new Worker(
      QUEUE_NAMES.WHATSAPP_INBOUND,
      async (job: any) => {
        const { workspaceId, message } = job.data as {
          workspaceId: string;
          message: any;
        };

        logger.info({ jobId: job.id, workspaceId, messageId: message.messageId }, 'Processing WhatsApp Inbound Message');

        const isNew = await webhookEventService.recordAndCheckDuplicate({
          eventId: message.messageId,
          provider: 'whatsapp',
          workspaceId,
          payload: message,
        });

        if (!isNew) {
          logger.info({ messageId: message.messageId }, 'WhatsApp Inbound duplicate event skipped');
          return;
        }

        let customer = await prisma.customer.findFirst({
          where: { phone: message.from, workspaceId, deletedAt: null },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              workspaceId,
              name: `WhatsApp Contact (${message.from})`,
              phone: message.from,
              sourceChannel: 'WHATSAPP',
              firstContactAt: new Date(),
            },
          });
        }

        let conversation = await prisma.conversation.findFirst({
          where: { customerId: customer.id, channel: 'WHATSAPP', status: 'OPEN', workspaceId, deletedAt: null },
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              workspaceId,
              customerId: customer.id,
              channel: 'WHATSAPP',
              status: 'OPEN',
            },
          });
        }

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderType: 'CUSTOMER',
            content: message.text || '[Media Message]',
            messageType: message.type.toUpperCase(),
            metadata: JSON.stringify({ messageId: message.messageId }),
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        });

        await triggerAIEmployeeWhatsAppResponse(workspaceId, conversation.id, customer.id, message.from, message.text || '');
      },
      { connection },
    );

    // 4. Stripe Webhook Worker
    const stripeWebhookWorker = new Worker(
      QUEUE_NAMES.STRIPE_WEBHOOK,
      async (job: any) => {
        const { workspaceId, event } = job.data as {
          workspaceId: string;
          event: any;
        };

        logger.info({ jobId: job.id, workspaceId, eventType: event.type }, 'Processing Stripe Webhook Event');

        const isNew = await webhookEventService.recordAndCheckDuplicate({
          eventId: event.id,
          provider: 'stripe',
          workspaceId,
          payload: event,
        });

        if (!isNew) {
          logger.info({ eventId: event.id }, 'Stripe Webhook duplicate event skipped');
          return;
        }

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          const customerEmail = session.customer_details?.email || session.customer_email;
          if (customerEmail) {
            const customer = await prisma.customer.findFirst({
              where: { email: customerEmail, workspaceId, deletedAt: null },
            });

            if (customer) {
              const lead = await prisma.lead.findFirst({
                where: { customerId: customer.id, workspaceId, deletedAt: null },
              });

              if (lead) {
                await prisma.lead.update({
                  where: { id: lead.id },
                  data: { status: 'WON' },
                });

                logger.info({ leadId: lead.id, customerId: customer.id }, 'Stripe checkout completed; Lead status set to WON');

                try {
                  await followupEmployeeService.createFollowUp(workspaceId, {
                    leadId: lead.id,
                    triggerType: 'CUSTOMER_REENGAGEMENT',
                  });
                } catch (followupErr) {
                  logger.error({ followupErr }, 'Failed to trigger follow-up sequence after checkout completed');
                }
              }
            }
          }
        } else if (event.type === 'invoice.payment_failed') {
          const invoice = event.data.object;
          const customerEmail = invoice.customer_email;
          if (customerEmail) {
            const workspaceMember = await prisma.workspaceMember.findFirst({
              where: { workspaceId, role: 'WORKSPACE_OWNER' },
            }) || await prisma.workspaceMember.findFirst({
              where: { workspaceId },
            });

            if (workspaceMember) {
              await prisma.notification.create({
                data: {
                  workspaceId,
                  userId: workspaceMember.userId,
                  type: 'BILLING_ALERT',
                  title: 'Stripe Payment Failed',
                  message: `Stripe invoice payment failed for customer ${customerEmail}.`,
                  sentVia: 'EMAIL',
                },
              });
            }

            const customer = await prisma.customer.findFirst({
              where: { email: customerEmail, workspaceId, deletedAt: null },
            });

            if (customer) {
              try {
                await followupEmployeeService.createFollowUp(workspaceId, {
                  customerId: customer.id,
                  triggerType: 'PROPOSAL_REMINDER',
                });
              } catch (followupErr) {
                logger.error({ followupErr }, 'Failed to trigger follow-up sequence after payment failed');
              }
            }
          }
        } else if (event.type === 'customer.subscription.deleted') {
          const subscription = event.data.object;
          const customerId = subscription.customer;

          try {
            const Stripe = require('stripe');
            const credentials = await credentialService.getCredentials(workspaceId, 'stripe');
            const stripe = new Stripe(credentials.apiKey!, { apiVersion: '2023-10-16' });
            const stripeCustomer = await stripe.customers.retrieve(customerId);
            const email = (stripeCustomer as any).email;

            if (email) {
              const customer = await prisma.customer.findFirst({
                where: { email, workspaceId, deletedAt: null },
              });

              if (customer) {
                const existingTags = customer.tags ? customer.tags.split(',') : [];
                if (!existingTags.includes('churned')) {
                  existingTags.push('churned');
                  await prisma.customer.update({
                    where: { id: customer.id },
                    data: { tags: existingTags.join(',') },
                  });
                }

                await followupEmployeeService.createFollowUp(workspaceId, {
                  customerId: customer.id,
                  triggerType: 'CUSTOMER_REENGAGEMENT',
                });
              }
            }
          } catch (err) {
            logger.error({ err, workspaceId }, 'Error processing customer subscription deletion churn flow');
          }
        }
      },
      { connection },
    );

    // 5. Generic Webhook (CRM Lead Ingestion) Worker
    const genericWebhookWorker = new Worker(
      QUEUE_NAMES.GENERIC_WEBHOOK,
      async (job: any) => {
        const { workspaceId, payload } = job.data as {
          workspaceId: string;
          payload: any;
        };

        logger.info({ jobId: job.id, workspaceId }, 'Processing CRM Webhook Lead Ingestion');

        const eventId = payload.eventId || payload.id || `crm_${Date.now()}`;
        const isNew = await webhookEventService.recordAndCheckDuplicate({
          eventId,
          provider: 'generic_webhook',
          workspaceId,
          payload,
        });

        if (!isNew) {
          logger.info({ eventId }, 'CRM Webhook duplicate event skipped');
          return;
        }

        let customer = await prisma.customer.findFirst({
          where: { email: payload.email, workspaceId, deletedAt: null },
        });

        if (!customer && payload.email) {
          customer = await prisma.customer.create({
            data: {
              workspaceId,
              name: payload.name || `CRM Contact (${payload.email})`,
              email: payload.email,
              phone: payload.phone || null,
              sourceChannel: 'CRM_INGESTION',
              firstContactAt: new Date(),
            },
          });
        }

        if (!customer) {
          logger.warn({ workspaceId }, 'CRM Ingestion skipped: no email provided in lead payload');
          return;
        }

        const lead = await prisma.lead.create({
          data: {
            workspaceId,
            customerId: customer.id,
            status: 'NEW',
            source: payload.source || 'CRM_INGESTION',
          },
        });

        logger.info({ leadId: lead.id, workspaceId }, 'CRM Lead created successfully');

        try {
          const activeSalesEmployee = await prisma.aIEmployee.findFirst({
            where: { workspaceId, employeeType: 'SALES', status: 'ACTIVE', deletedAt: null },
          });

          if (activeSalesEmployee) {
            const qualification = await salesEmployeeService.qualifyLead(workspaceId, {
              leadId: lead.id,
              fit: payload.fit || 'neutral',
              budget: payload.budget || 'neutral',
              timeline: payload.timeline || 'neutral',
              authority: payload.authority || 'neutral',
              notes: payload.notes || 'Ingested from CRM integration',
            });

            if (qualification.score === 'HOT' || qualification.score === 'WARM') {
              await followupEmployeeService.createFollowUp(workspaceId, {
                leadId: lead.id,
                triggerType: 'LEAD_SILENCE',
                scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              });
              logger.info({ leadId: lead.id }, 'Lead qualified as HOT/WARM; Follow-up re-engagement scheduled');
            }
          }
        } catch (err) {
          logger.error({ err, leadId: lead.id }, 'Failed to qualify lead or schedule follow-up after CRM ingestion');
        }
      },
      { connection },
    );

    _workers.push(
      whatsappWorker,
      emailWorker,
      whatsappInboundWorker,
      stripeWebhookWorker,
      genericWebhookWorker,
    );

    // Set up error handlers
    for (const w of _workers) {
      w.on('error', (err: Error) => {
        logger.error({ err, queue: w.name }, 'BullMQ Worker encountered error');
      });
      w.on('failed', (job: any, err: Error) => {
        logger.error({ err, jobId: job?.id, queue: w.name }, 'BullMQ Job failed');
      });
    }

    logger.info({ count: _workers.length }, 'Background integration workers initialized successfully');
  } catch (err) {
    logger.error({ err }, 'Error initializing background integration workers');
  }
}

export async function closeIntegrationWorkers(): Promise<void> {
  await Promise.all(_workers.map((w) => w.close()));
  _workers = [];
}
