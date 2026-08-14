// backend/src/modules/jobs/processors/digest.processor.ts
/**
 * Workspace Daily/Weekly Performance Digest Processor (`digest-queue`).
 *
 * Responsibilities:
 *  - Aggregates stats per workspace (conversations, leads, appointments, resolution rates).
 *  - Dynamically resolves workspace sender credentials or fallback to DEFAULT_SYSTEM_EMAIL.
 *  - Formats and dispatches HTML summary emails to workspace owners/admins.
 */

import { prisma } from '@database/index';
import { analyticsService } from '@modules/analytics/services/analytics.service';
import { credentialService } from '@modules/integrations/services/credential.service';
import { emailProvider } from '@modules/integrations/providers/email/email.provider';
import { logger } from '@shared/logger';

const DEFAULT_SYSTEM_EMAIL =
  process.env['DEFAULT_SYSTEM_EMAIL'] ||
  process.env['PROJECT_EMAIL'] ||
  'trevolk.official@gmail.com';

function generateDigestHtml(workspaceName: string, metrics: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; color: #333; margin: 0; padding: 20px; }
          .card { background: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
          .content { padding: 24px; }
          .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
          .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: 700; color: #4f46e5; margin-top: 4px; }
          .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>Trevolk AI Workforce</h1>
            <p style="margin-top: 4px; opacity: 0.9;">Daily Performance Digest — ${workspaceName}</p>
          </div>
          <div class="content">
            <p>Here is your workspace activity snapshot for the last 24 hours:</p>
            <div class="stat-grid">
              <div class="stat-box">
                <div class="stat-label">Total Conversations</div>
                <div class="stat-value">${metrics.totalConversations}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Resolution Rate</div>
                <div class="stat-value">${metrics.resolutionRate}%</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Human Escalations</div>
                <div class="stat-value">${metrics.escalatedConversations}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">CSAT Score</div>
                <div class="stat-value">⭐ ${metrics.csatScore}</div>
              </div>
            </div>
            <p style="margin-top: 24px; font-size: 14px; color: #475569;">
              Your 4 AI Employees (Sales, Support, Receptionist, Follow-up) are actively optimizing customer interactions.
            </p>
          </div>
          <div class="footer">
            Sent automatically by Trevolk AI Workforce • <a href="https://trevolk.com" style="color: #4f46e5;">Dashboard</a>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function processDigestJob(job: any): Promise<void> {
  logger.info({ jobId: job.id }, 'Starting workspace digest generation job');

  const workspaces = await prisma.workspace.findMany({
    where: { deletedAt: null },
    include: {
      members: {
        where: { role: { in: ['OWNER', 'ADMIN'] } },
        include: { user: true },
      },
    },
  });

  for (const workspace of workspaces) {
    try {
      const overview = await analyticsService.getWorkspaceOverview(workspace.id, { days: 1 });
      const metrics = overview.metrics;

      // Determine sender email
      let senderEmail = DEFAULT_SYSTEM_EMAIL;
      try {
        const gmailCreds = await credentialService.getCredentials(workspace.id, 'gmail');
        if (gmailCreds.smtpUser) {
          senderEmail = gmailCreds.smtpUser;
        }
      } catch {
        // Fall back to default
      }

      const html = generateDigestHtml(workspace.name, metrics);

      // Send to workspace owners and admins
      for (const member of workspace.members) {
        if (member.user.email) {
          try {
            await emailProvider.sendEmail(workspace.id, {
              to: member.user.email,
              subject: `📊 Daily Performance Digest — ${workspace.name}`,
              html,
              fromEmail: senderEmail,
              fromName: `${workspace.name} (via Trevolk AI)`,
            });

            logger.info(
              { workspaceId: workspace.id, recipient: member.user.email },
              'Workspace digest email dispatched',
            );
          } catch (mailErr: any) {
            logger.error(
              { err: mailErr.message, workspaceId: workspace.id, recipient: member.user.email },
              'Failed to send digest email to recipient',
            );
          }
        }
      }
    } catch (err: any) {
      logger.error({ err: err.message, workspaceId: workspace.id }, 'Error processing workspace digest');
    }
  }

  logger.info('Workspace digest job completed successfully');
}
