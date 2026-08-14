// backend/tests/integration/integrations.spec.ts

const mockEnqueueJob = jest.fn();

jest.mock('@database/index', () => {
  const { createPrismaMock } = require('../helpers/prisma-mock');
  const prisma = createPrismaMock();
  return {
    prisma,
    db: prisma,
    disconnectPrisma: jest.fn(),
    isDatabaseReachable: jest.fn().mockResolvedValue(true),
  };
});

jest.mock('@common/queues/queue.factory', () => {
  return {
    QUEUE_NAMES: {
      WHATSAPP_SEND: 'whatsapp:send',
      WHATSAPP_INBOUND: 'whatsapp:inbound',
      EMAIL_SEND: 'email:send',
      CALENDAR_SYNC: 'calendar:sync',
      STRIPE_WEBHOOK: 'stripe:webhook',
      GENERIC_WEBHOOK: 'generic:webhook',
    },
    enqueueJob: mockEnqueueJob,
  };
});

import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../../src/app';
import { prisma } from '@database/index';
import { credentialService } from '../../src/modules/integrations/services/credential.service';
import { calendarAdapter } from '../../src/modules/integrations/providers/adapters';

const app = createApp();
const VALID_PASSWORD = 'correctHorseBattery9';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

async function registerUser(prefix: string) {
  const email = uniqueEmail(prefix);
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: VALID_PASSWORD, name: prefix });

  return {
    email,
    accessToken: response.body.data.tokens.accessToken as string,
    organizationId: response.body.data.workspace.organizationId as string,
    workspaceId: response.body.data.workspace.workspaceId as string,
  };
}

function authed(token: string, workspaceId: string) {
  return { Authorization: `Bearer ${token}`, 'X-Workspace-Id': workspaceId };
}

describe('Phase 8: Integrations & Webhooks End-to-End', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Security & HMAC signature validation middleware', () => {
    it('rejects custom CRM webhook when signature header is missing but secret is configured', async () => {
      const owner = await registerUser('crm-secure');

      // Configure CRM Integration with webhook secret
      await credentialService.upsertCredentials(
        owner.workspaceId,
        'generic_webhook',
        { subscriptions: [], secret: 'secure_crm_secret' },
        'user-id-1',
        { subscriptionCount: 0 }
      );

      const response = await request(app)
        .post(`/api/v1/integrations/webhooks/${owner.workspaceId}/crm`)
        .send({ email: 'test@example.com' });

      // Missing signature header -> 403 Forbidden
      expect(response.status).toBe(403);
    });

    it('rejects CRM webhook when signature mismatches', async () => {
      const owner = await registerUser('crm-mismatch');

      // Configure CRM Integration with webhook secret
      await credentialService.upsertCredentials(
        owner.workspaceId,
        'generic_webhook',
        { subscriptions: [], secret: 'secure_crm_secret' },
        'user-id-2',
        { subscriptionCount: 0 }
      );

      const response = await request(app)
        .post(`/api/v1/integrations/webhooks/${owner.workspaceId}/crm`)
        .set('x-trevolk-signature', 'invalid_signature_hash')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(403);
    });

    it('accepts CRM webhook with valid HMAC signature', async () => {
      const owner = await registerUser('crm-valid');
      const secret = 'secure_crm_secret';

      // Configure CRM Integration
      await credentialService.upsertCredentials(
        owner.workspaceId,
        'generic_webhook',
        { subscriptions: [], secret },
        'user-id-3',
        { subscriptionCount: 0 }
      );

      const body = { email: 'test@example.com', name: 'CRM Contact' };
      const bodyStr = JSON.stringify(body);
      const signature = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');

      const response = await request(app)
        .post(`/api/v1/integrations/webhooks/${owner.workspaceId}/crm`)
        .set('x-trevolk-signature', signature)
        .send(body);

      expect(response.status).toBe(200);
      expect(mockEnqueueJob).toHaveBeenCalled();
    });
  });

  describe('WhatsApp Inbound Webhook handler', () => {
    it('receives verification challenge via GET and handles GET challenges', async () => {
      process.env['WHATSAPP_VERIFY_TOKEN'] = 'test_verify_token';

      const response = await request(app)
        .get('/api/v1/integrations/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'test_verify_token',
          'hub.challenge': 'challenge_code_123',
        });

      expect(response.status).toBe(200);
      expect(response.text).toBe('challenge_code_123');
    });

    it('queues inbound WhatsApp messages', async () => {
      const owner = await registerUser('wa-inbound');

      // Create WhatsApp integration connection in DB
      await credentialService.upsertCredentials(
        owner.workspaceId,
        'whatsapp',
        { accessToken: 'wa_tok', phoneNumberId: 'phone_number_id_999' },
        'user-id-4',
        { phoneNumberId: 'phone_number_id_999' }
      );

      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  metadata: { phone_number_id: 'phone_number_id_999' },
                  messages: [
                    {
                      from: '1234567890',
                      id: 'wa_msg_id_1001',
                      timestamp: '1699999999',
                      type: 'text',
                      text: { body: 'hello support' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/integrations/whatsapp/webhook')
        .send(payload);

      expect(response.status).toBe(200);
      expect(mockEnqueueJob).toHaveBeenCalledWith(
        'whatsapp:inbound',
        'whatsapp:inbound',
        expect.objectContaining({
          workspaceId: owner.workspaceId,
          message: expect.objectContaining({
            from: '1234567890',
            messageId: 'wa_msg_id_1001',
            text: 'hello support',
          }),
        })
      );
    });
  });

  describe('Calendar Availability & Receptionist Booking rules', () => {
    it('enforces workspace working hours (rejects slot outside working hours)', async () => {
      const owner = await registerUser('hours-check');

      // Configure default working hours: 09:00 - 17:00 (Mon-Fri)
      await prisma.workspace.update({
        where: { id: owner.workspaceId },
        data: {
          defaultWorkingHours: JSON.stringify({ start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] }),
          timezone: 'UTC',
        },
      });

      // 2026-08-16 is a Sunday, or 03:00 UTC is outside 09:00-17:00
      const outsideHoursDate = new Date('2026-08-16T03:00:00Z');
      const endDate = new Date(outsideHoursDate.getTime() + 3600000);

      const isAvail = await calendarAdapter.isSlotAvailable(owner.workspaceId, outsideHoursDate, endDate);
      expect(isAvail).toBe(false);
    });

    it('verifies slot availability and overlapping bookings (prevents double-booking)', async () => {
      const owner = await registerUser('double-booking');

      await prisma.workspace.update({
        where: { id: owner.workspaceId },
        data: {
          defaultWorkingHours: JSON.stringify({ start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] }),
          timezone: 'UTC',
        },
      });

      const startDate = new Date('2026-08-12T10:00:00Z');
      const endDate = new Date('2026-08-12T11:00:00Z');

      // Initially slot is available
      let isAvail = await calendarAdapter.isSlotAvailable(owner.workspaceId, startDate, endDate);
      expect(isAvail).toBe(true);

      // Create an active AI Employee
      const emp = await prisma.aIEmployee.create({
        data: { workspaceId: owner.workspaceId, employeeType: 'RECEPTIONIST', name: 'Front Desk AI' },
      });

      // Create Customer
      const customer = await prisma.customer.create({
        data: { workspaceId: owner.workspaceId, name: 'John Doe' },
      });

      // Book appointment
      await calendarAdapter.bookAppointment(owner.workspaceId, {
        customerId: customer.id,
        aiEmployeeId: emp.id,
        title: 'Meeting 1',
        start: startDate,
        end: endDate,
      });

      // Double-booking slot is now unavailable
      isAvail = await calendarAdapter.isSlotAvailable(owner.workspaceId, startDate, endDate);
      expect(isAvail).toBe(false);

      // Check overlapping starts within slot
      const overlappingStart = new Date('2026-08-12T10:30:00Z');
      const overlappingEnd = new Date('2026-08-12T11:30:00Z');
      isAvail = await calendarAdapter.isSlotAvailable(owner.workspaceId, overlappingStart, overlappingEnd);
      expect(isAvail).toBe(false);
    });

    it('enforces buffer time constraints', async () => {
      const owner = await registerUser('buffer-test');

      await prisma.workspace.update({
        where: { id: owner.workspaceId },
        data: {
          defaultWorkingHours: JSON.stringify({ start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] }),
          timezone: 'UTC',
        },
      });

      const startDate = new Date('2026-08-12T10:00:00Z');
      const endDate = new Date('2026-08-12T11:00:00Z');

      const emp = await prisma.aIEmployee.create({
        data: { workspaceId: owner.workspaceId, employeeType: 'RECEPTIONIST', name: 'Receptionist' },
      });
      const customer = await prisma.customer.create({
        data: { workspaceId: owner.workspaceId, name: 'Alice' },
      });

      // Book first meeting
      await calendarAdapter.bookAppointment(owner.workspaceId, {
        customerId: customer.id,
        aiEmployeeId: emp.id,
        title: 'Alice Meeting',
        start: startDate,
        end: endDate,
      });

      // Try booking a adjacent meeting from 11:00 to 12:00, but with a 15-minute buffer requirement
      const nextStart = new Date('2026-08-12T11:00:00Z');
      const nextEnd = new Date('2026-08-12T12:00:00Z');

      // Should fail because 11:00 is within 15-min buffer window of previous meeting (10:00 - 11:00)
      const isAvailWithBuffer = await calendarAdapter.isSlotAvailable(
        owner.workspaceId,
        nextStart,
        nextEnd,
        15 // 15-minute buffer
      );

      expect(isAvailWithBuffer).toBe(false);

      // 11:15 to 12:15 should succeed with 15-min buffer
      const bufferFreeStart = new Date('2026-08-12T11:15:00Z');
      const bufferFreeEnd = new Date('2026-08-12T12:15:00Z');
      const isAvailWithCorrectBuffer = await calendarAdapter.isSlotAvailable(
        owner.workspaceId,
        bufferFreeStart,
        bufferFreeEnd,
        15
      );
      expect(isAvailWithCorrectBuffer).toBe(true);
    });
  });

  describe('Stripe webhook events & payment flows', () => {
    it('queues stripe webhook events correctly', async () => {
      const owner = await registerUser('stripe-webhook-queue');

      // Create Stripe integration connection
      await credentialService.upsertCredentials(
        owner.workspaceId,
        'stripe',
        { apiKey: 'stripe_api_key', webhookSecret: 'whsec_test_secret' },
        'user-id-5',
        { stripeWebhookConfigured: true }
      );

      const payload = {
        id: 'evt_stripe_101',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_completed_1',
            customer: 'cus_test_1',
            customer_details: { email: 'customer@example.com' },
          },
        },
      };

      const Stripe = require('stripe');
      const stripe = new Stripe('sk_test_dummy');
      const signature = stripe.webhooks.generateTestHeaderString({
        payload: JSON.stringify(payload),
        secret: 'whsec_test_secret',
      });

      const response = await request(app)
        .post('/api/v1/integrations/stripe/webhook')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(mockEnqueueJob).toHaveBeenCalledWith(
        'stripe:webhook',
        'stripe:webhook',
        expect.objectContaining({
          workspaceId: owner.workspaceId,
          event: expect.objectContaining({
            id: 'evt_stripe_101',
            type: 'checkout.session.completed',
          }),
        })
      );
    });
  });
});
