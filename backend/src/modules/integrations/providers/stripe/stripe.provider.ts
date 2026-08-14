// backend/src/modules/integrations/providers/stripe/stripe.provider.ts
/**
 * Stripe Billing & Payment Integration Adapter.
 *
 * Responsibilities:
 *  - Validate and construct Stripe webhook events securely.
 *  - Provide safe, read-only lookup helper methods for AI Support and Sales agents
 *    to verify payment/order status without touching sensitive credit card/PCI data.
 */
import { credentialService } from '../../services/credential.service';
import { logger } from '@shared/logger';

export interface StripeSubscriptionStatus {
  subscriptionId: string;
  status: string; // active, past_due, canceled, unpaid, etc.
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  customerEmail: string;
}

export interface StripeOrderStatus {
  id: string;
  amount: number;
  currency: string;
  status: string; // succeeded, pending, failed
  customerEmail: string;
  createdAt: Date;
}

export const stripeProvider = {
  /**
   * Safe read-only lookup helper to retrieve subscription details.
   * Leverages Stripe API with stored credentials for a workspace.
   */
  async getSubscriptionStatus(
    workspaceId: string,
    customerIdOrEmail: string,
  ): Promise<StripeSubscriptionStatus | null> {
    const credentials = await credentialService.getCredentials(workspaceId, 'stripe');
    const apiKey = credentials.apiKey;

    if (!apiKey) {
      throw new Error('Stripe integration not configured for this workspace');
    }

    // Lazy load Stripe
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const Stripe = require('stripe') as typeof import('stripe');
    const stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' as any });

    try {
      let customerId = customerIdOrEmail;

      if (customerIdOrEmail.includes('@')) {
        const customers = await stripe.customers.list({
          email: customerIdOrEmail,
          limit: 1,
        });
        if (customers.data.length === 0) return null;
        customerId = customers.data[0]!.id;
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
        status: 'all',
      });

      if (subscriptions.data.length === 0) return null;

      const sub = subscriptions.data[0]!;
      const customer = await stripe.customers.retrieve(customerId);
      const customerEmail = (customer as any).email || '';

      return {
        subscriptionId: sub.id,
        status: sub.status,
        currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
        cancelAtPeriodEnd: (sub as any).cancel_at_period_end,
        customerEmail,
      };
    } catch (err) {
      logger.error({ err, workspaceId, customerIdOrEmail }, 'Stripe subscription lookup failed');
      return null;
    }
  },

  /**
   * Safe read-only lookup helper to check status of recent orders/charges.
   */
  async getOrderStatus(
    workspaceId: string,
    orderIdOrEmail: string,
  ): Promise<StripeOrderStatus | null> {
    const credentials = await credentialService.getCredentials(workspaceId, 'stripe');
    const apiKey = credentials.apiKey;

    if (!apiKey) {
      throw new Error('Stripe integration not configured for this workspace');
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe') as typeof import('stripe');
    const stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' as any });

    try {
      if (orderIdOrEmail.startsWith('ch_') || orderIdOrEmail.startsWith('pi_')) {
        let charge;
        if (orderIdOrEmail.startsWith('ch_')) {
          charge = await stripe.charges.retrieve(orderIdOrEmail);
        } else {
          const pi = await stripe.paymentIntents.retrieve(orderIdOrEmail);
          charge = pi.latest_charge ? await stripe.charges.retrieve(pi.latest_charge as string) : null;
        }

        if (!charge) return null;

        const customerEmail = charge.receipt_email || (charge.billing_details?.email) || '';

        return {
          id: charge.id,
          amount: charge.amount / 100, // convert from cents
          currency: charge.currency,
          status: charge.status,
          customerEmail,
          createdAt: new Date(charge.created * 1000),
        };
      } else if (orderIdOrEmail.includes('@')) {
        // Query by email
        const charges = await stripe.charges.list({
          limit: 5,
        });

        const userCharge = charges.data.find(
          (c) =>
            c.receipt_email === orderIdOrEmail ||
            c.billing_details?.email === orderIdOrEmail,
        );

        if (!userCharge) return null;

        return {
          id: userCharge.id,
          amount: userCharge.amount / 100,
          currency: userCharge.currency,
          status: userCharge.status,
          customerEmail: orderIdOrEmail,
          createdAt: new Date(userCharge.created * 1000),
        };
      }

      return null;
    } catch (err) {
      logger.error({ err, workspaceId, orderIdOrEmail }, 'Stripe order status lookup failed');
      return null;
    }
  },
};
