import { randomUUID } from 'node:crypto';

/**
 * Minimal in-memory stand-in for the subset of `PrismaClient` used across test suites.
 */
export function createPrismaMock() {
  const users = new Map<string, any>();
  const usersByEmail = new Map<string, string>();
  const organizations = new Map<string, any>();
  const workspaces = new Map<string, any>();
  const memberships = new Map<string, any>();
  const refreshTokens = new Map<string, any>();
  const aiEmployees = new Map<string, any>();
  const leads = new Map<string, any>();
  const customers = new Map<string, any>();
  const appointments = new Map<string, any>();
  const conversations = new Map<string, any>();
  const messages = new Map<string, any>();
  const knowledgeBaseEntries = new Map<string, any>();
  const followUps = new Map<string, any>();
  const integrations = new Map<string, any>();
  const notifications = new Map<string, any>();

  function appointmentOverlaps(
    appointment: { startTime: Date; endTime: Date; status: string; id: string },
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): boolean {
    if (excludeId && appointment.id === excludeId) return false;
    if (['CANCELLED', 'NO_SHOW'].includes(appointment.status)) return false;
    return appointment.startTime < endTime && appointment.endTime > startTime;
  }

  function withWorkspace(membership: any, include: any) {
    return include?.workspace
      ? { ...membership, workspace: workspaces.get(membership.workspaceId) }
      : membership;
  }

  function withUser(membership: any, include: any) {
    const base = withWorkspace(membership, include);
    return include?.user ? { ...base, user: users.get(membership.userId) } : base;
  }

  const client: any = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.email !== undefined) {
          const id = usersByEmail.get(where.email);
          return id ? (users.get(id) ?? null) : null;
        }
        if (where.id !== undefined) {
          return users.get(where.id) ?? null;
        }
        return null;
      },
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const user = {
          id,
          email: data.email,
          name: data.name ?? null,
          passwordHash: data.passwordHash ?? null,
          avatarUrl: data.avatarUrl ?? null,
          authProviderId: data.authProviderId ?? null,
          status: data.status ?? 'ACTIVE',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          lastLoginAt: null,
        };
        users.set(id, user);
        usersByEmail.set(user.email, id);
        return user;
      },
      update: async ({ where, data }: any) => {
        const user = users.get(where.id);
        if (!user) throw new Error('Mock: user not found');
        Object.assign(user, data, { updatedAt: new Date() });
        return user;
      },
    },

    organization: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const organization = {
          id,
          name: data.name,
          industry: data.industry ?? null,
          status: data.status ?? 'ACTIVE',
          ownerUserId: data.ownerUserId,
          createdAt: now,
          updatedAt: now,
        };
        organizations.set(id, organization);
        return organization;
      },
      findUnique: async ({ where }: any) => {
        return organizations.get(where.id) ?? null;
      },
      update: async ({ where, data }: any) => {
        const organization = organizations.get(where.id);
        if (!organization) throw new Error('Mock: organization not found');
        Object.assign(organization, data, { updatedAt: new Date() });
        return organization;
      },
    },

    workspace: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const workspace = {
          id,
          organizationId: data.organizationId,
          name: data.name,
          industry: data.industry ?? null,
          branding: data.branding ?? null,
          defaultWorkingHours: data.defaultWorkingHours ?? null,
          timezone: data.timezone ?? 'UTC',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        workspaces.set(id, workspace);
        return workspace;
      },
      findUnique: async ({ where }: any) => {
        return workspaces.get(where.id) ?? null;
      },
      findMany: async ({ where }: any) => {
        let results = [...workspaces.values()];
        if (where?.organizationId !== undefined) {
          results = results.filter((w) => w.organizationId === where.organizationId);
        }
        return results;
      },
      update: async ({ where, data }: any) => {
        const workspace = workspaces.get(where.id);
        if (!workspace) throw new Error('Mock: workspace not found');
        Object.assign(workspace, data, { updatedAt: new Date() });
        return workspace;
      },
    },

    workspaceMember: {
      create: async ({ data, include }: any) => {
        const id = randomUUID();
        const now = new Date();
        const membership = {
          id,
          userId: data.userId,
          workspaceId: data.workspaceId,
          role: data.role,
          invitedAt: data.invitedAt ?? now,
          acceptedAt: data.acceptedAt ?? null,
          createdAt: now,
          updatedAt: now,
        };
        memberships.set(id, membership);
        return withUser(membership, include);
      },
      findMany: async ({ where, include }: any) => {
        let results = [...memberships.values()];
        if (where?.userId !== undefined) {
          results = results.filter((m) => m.userId === where.userId);
        }
        if (where?.workspaceId !== undefined) {
          results = results.filter((m) => m.workspaceId === where.workspaceId);
        }
        if (where?.acceptedAt === null) {
          results = results.filter((m) => m.acceptedAt === null);
        }
        if (where?.role !== undefined) {
          results = results.filter((m) => m.role === where.role);
        }
        return results.map((m) => withUser(m, include));
      },
      findUnique: async ({ where, include }: any) => {
        if (where.id !== undefined) {
          const found = memberships.get(where.id);
          return found ? withUser(found, include) : null;
        }
        const key = where.userId_workspaceId;
        const found = [...memberships.values()].find(
          (m) => m.userId === key.userId && m.workspaceId === key.workspaceId,
        );
        return found ? withUser(found, include) : null;
      },
      update: async ({ where, data, include }: any) => {
        const membership = memberships.get(where.id);
        if (!membership) throw new Error('Mock: workspace member not found');
        Object.assign(membership, data, { updatedAt: new Date() });
        return withUser(membership, include);
      },
      delete: async ({ where }: any) => {
        const membership = memberships.get(where.id);
        if (!membership) throw new Error('Mock: workspace member not found');
        memberships.delete(where.id);
        return membership;
      },
      count: async ({ where }: any) => {
        let results = [...memberships.values()];
        if (where?.workspaceId !== undefined) {
          results = results.filter((m) => m.workspaceId === where.workspaceId);
        }
        if (where?.role !== undefined) {
          results = results.filter((m) => m.role === where.role);
        }
        if (where?.id?.not !== undefined) {
          results = results.filter((m) => m.id !== where.id.not);
        }
        return results.length;
      },
    },

    refreshToken: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const token = {
          id,
          userId: data.userId,
          expiresAt: data.expiresAt,
          revokedAt: null,
          createdAt: now,
        };
        refreshTokens.set(id, token);
        return token;
      },
      findUnique: async ({ where, include }: any) => {
        const token = refreshTokens.get(where.id);
        if (!token) return null;
        return include?.user ? { ...token, user: users.get(token.userId) } : token;
      },
      update: async ({ where, data }: any) => {
        const token = refreshTokens.get(where.id);
        if (!token) throw new Error('Mock: refresh token not found');
        Object.assign(token, data);
        return token;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const token of refreshTokens.values()) {
          const matchesUser = where.userId === undefined || token.userId === where.userId;
          const matchesId = where.id === undefined || token.id === where.id;
          const matchesRevoked =
            where.revokedAt === undefined || token.revokedAt === where.revokedAt;
          if (matchesUser && matchesId && matchesRevoked) {
            Object.assign(token, data);
            count += 1;
          }
        }
        return { count };
      },
    },

    aIEmployee: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const employee = {
          id,
          workspaceId: data.workspaceId,
          employeeType: data.employeeType,
          name: data.name,
          description: data.description ?? null,
          status: data.status ?? 'NEEDS_SETUP',
          configuration: data.configuration ?? '{}',
          lastActiveAt: data.lastActiveAt ?? null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        aiEmployees.set(id, employee);
        return employee;
      },
      findFirst: async ({ where }: any) => {
        let results = [...aiEmployees.values()];
        if (where?.id !== undefined) {
          results = results.filter((e) => e.id === where.id);
        }
        if (where?.workspaceId !== undefined) {
          results = results.filter((e) => e.workspaceId === where.workspaceId);
        }
        if (where?.employeeType !== undefined) {
          results = results.filter((e) => e.employeeType === where.employeeType);
        }
        if (where?.deletedAt === null) {
          results = results.filter((e) => e.deletedAt === null);
        }
        return results[0] ?? null;
      },
      findMany: async ({ where }: any) => {
        let results = [...aiEmployees.values()];
        if (where?.workspaceId !== undefined) {
          results = results.filter((e) => e.workspaceId === where.workspaceId);
        }
        if (where?.employeeType !== undefined) {
          results = results.filter((e) => e.employeeType === where.employeeType);
        }
        if (where?.status !== undefined) {
          results = results.filter((e) => e.status === where.status);
        }
        if (where?.deletedAt === null) {
          results = results.filter((e) => e.deletedAt === null);
        }
        return results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      },
      update: async ({ where, data }: any) => {
        const employee = aiEmployees.get(where.id);
        if (!employee) throw new Error('Mock: AI employee not found');
        Object.assign(employee, data, { updatedAt: new Date() });
        return employee;
      },
    },

    lead: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const lead = {
          id,
          workspaceId: data.workspaceId,
          aiEmployeeId: data.aiEmployeeId ?? null,
          customerId: data.customerId ?? null,
          status: data.status ?? 'NEW',
          score: data.score ?? null,
          qualificationAnswers: data.qualificationAnswers ?? null,
          source: data.source ?? null,
          assignedUserId: data.assignedUserId ?? null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        leads.set(id, lead);
        return lead;
      },
      findFirst: async ({ where }: any) => {
        let results = [...leads.values()];
        if (where?.id !== undefined) {
          results = results.filter((l) => l.id === where.id);
        }
        if (where?.workspaceId !== undefined) {
          results = results.filter((l) => l.workspaceId === where.workspaceId);
        }
        if (where?.customerId !== undefined) {
          results = results.filter((l) => l.customerId === where.customerId);
        }
        if (where?.deletedAt === null) {
          results = results.filter((l) => l.deletedAt === null);
        }
        return results[0] ?? null;
      },
      findMany: async ({ where }: any) => {
        let results = [...leads.values()];
        if (where?.workspaceId !== undefined) {
          results = results.filter((l) => l.workspaceId === where.workspaceId);
        }
        if (where?.status !== undefined) {
          results = results.filter((l) => l.status === where.status);
        }
        if (where?.deletedAt === null) {
          results = results.filter((l) => l.deletedAt === null);
        }
        return results;
      },
      update: async ({ where, data }: any) => {
        const lead = leads.get(where.id);
        if (!lead) throw new Error('Mock: lead not found');
        Object.assign(lead, data, { updatedAt: new Date() });
        return lead;
      },
    },

    customer: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const customer = {
          id,
          workspaceId: data.workspaceId,
          name: data.name ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          sourceChannel: data.sourceChannel ?? null,
          firstContactAt: data.firstContactAt ?? now,
          tags: data.tags ?? null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        customers.set(id, customer);
        return customer;
      },
      findFirst: async ({ where }: any) => {
        let results = [...customers.values()];
        if (where?.id !== undefined) {
          results = results.filter((c) => c.id === where.id);
        }
        if (where?.workspaceId !== undefined) {
          results = results.filter((c) => c.workspaceId === where.workspaceId);
        }
        if (where?.email !== undefined) {
          results = results.filter((c) => c.email === where.email);
        }
        if (where?.deletedAt === null) {
          results = results.filter((c) => c.deletedAt === null);
        }
        return results[0] ?? null;
      },
      findMany: async ({ where }: any) => {
        let results = [...customers.values()];
        if (where?.workspaceId !== undefined) {
          results = results.filter((c) => c.workspaceId === where.workspaceId);
        }
        if (where?.deletedAt === null) {
          results = results.filter((c) => c.deletedAt === null);
        }
        return results;
      },
      update: async ({ where, data }: any) => {
        const customer = customers.get(where.id);
        if (!customer) throw new Error('Mock: customer not found');
        Object.assign(customer, data, { updatedAt: new Date() });
        return customer;
      },
    },

    appointment: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const appointment = {
          id,
          workspaceId: data.workspaceId,
          customerId: data.customerId,
          leadId: data.leadId ?? null,
          aiEmployeeId: data.aiEmployeeId,
          integrationId: data.integrationId ?? null,
          startTime: data.startTime,
          endTime: data.endTime,
          status: data.status ?? 'SCHEDULED',
          externalCalendarRef: data.externalCalendarRef ?? null,
          reminderSentAt: data.reminderSentAt ?? null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        appointments.set(id, appointment);
        return appointment;
      },
      findFirst: async ({ where }: any) => {
        let results = [...appointments.values()];
        if (where?.id !== undefined) {
          results = results.filter((a) => a.id === where.id);
        }
        if (where?.workspaceId !== undefined) {
          results = results.filter((a) => a.workspaceId === where.workspaceId);
        }
        if (where?.deletedAt === null) {
          results = results.filter((a) => a.deletedAt === null);
        }
        if (where?.status?.notIn !== undefined) {
          results = results.filter((a) => !where.status.notIn.includes(a.status));
        }
        if (where?.AND && where?.workspaceId !== undefined) {
          const startCond = where.AND.find((c: any) => c.startTime?.lt !== undefined);
          const endCond = where.AND.find((c: any) => c.endTime?.gt !== undefined);
          if (startCond && endCond) {
            const slotStart = startCond.startTime.lt;
            const slotEnd = endCond.endTime.gt;
            const excludeId = where.id?.not;
            results = results.filter((a) =>
              appointmentOverlaps(a, slotStart, slotEnd, excludeId),
            );
          }
        }
        return results[0] ?? null;
      },
      findMany: async ({ where }: any) => {
        let results = [...appointments.values()];
        if (where?.workspaceId !== undefined) {
          results = results.filter((a) => a.workspaceId === where.workspaceId);
        }
        if (where?.customerId !== undefined) {
          results = results.filter((a) => a.customerId === where.customerId);
        }
        if (where?.leadId !== undefined) {
          results = results.filter((a) => a.leadId === where.leadId);
        }
        if (where?.aiEmployeeId !== undefined) {
          results = results.filter((a) => a.aiEmployeeId === where.aiEmployeeId);
        }
        if (where?.status !== undefined) {
          results = results.filter((a) => a.status === where.status);
        }
        if (where?.deletedAt === null) {
          results = results.filter((a) => a.deletedAt === null);
        }
        return results;
      },
      update: async ({ where, data }: any) => {
        const appointment = appointments.get(where.id);
        if (!appointment) throw new Error('Mock: appointment not found');
        Object.assign(appointment, data, { updatedAt: new Date() });
        return appointment;
      },
    },

    conversation: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const conversation = {
          id,
          workspaceId: data.workspaceId,
          customerId: data.customerId ?? null,
          leadId: data.leadId ?? null,
          aiEmployeeId: data.aiEmployeeId ?? null,
          integrationId: data.integrationId ?? null,
          channel: data.channel ?? 'WEB_CHAT',
          status: data.status ?? 'OPEN',
          assignedUserId: data.assignedUserId ?? null,
          lastMessageAt: data.lastMessageAt ?? now,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        conversations.set(id, conversation);
        return conversation;
      },
      findFirst: async ({ where }: any) => {
        let results = [...conversations.values()];
        if (where?.id !== undefined) {
          results = results.filter((c) => c.id === where.id);
        }
        if (where?.workspaceId !== undefined) {
          results = results.filter((c) => c.workspaceId === where.workspaceId);
        }
        if (where?.deletedAt === null) {
          results = results.filter((c) => c.deletedAt === null);
        }
        return results[0] ?? null;
      },
      findMany: async ({ where }: any) => {
        let results = [...conversations.values()];
        if (where?.workspaceId !== undefined) {
          results = results.filter((c) => c.workspaceId === where.workspaceId);
        }
        if (where?.status !== undefined) {
          results = results.filter((c) => c.status === where.status);
        }
        if (where?.deletedAt === null) {
          results = results.filter((c) => c.deletedAt === null);
        }
        return results;
      },
      update: async ({ where, data }: any) => {
        const conversation = conversations.get(where.id);
        if (!conversation) throw new Error('Mock: conversation not found');
        Object.assign(conversation, data, { updatedAt: new Date() });
        return conversation;
      },
    },

    message: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const message = {
          id,
          conversationId: data.conversationId,
          senderType: data.senderType,
          senderId: data.senderId ?? null,
          content: data.content,
          messageType: data.messageType ?? 'TEXT',
          metadata: data.metadata ?? null,
          isInternalNote: data.isInternalNote ?? false,
          sentAt: data.sentAt ?? now,
          createdAt: now,
          updatedAt: now,
        };
        messages.set(id, message);
        return message;
      },
    },

    knowledgeBaseEntry: {
      findMany: async ({ where }: any) => {
        let results = [...knowledgeBaseEntries.values()];
        if (where?.workspaceId !== undefined) {
          results = results.filter((k) => k.workspaceId === where.workspaceId);
        }
        if (where?.isActive !== undefined) {
          results = results.filter((k) => k.isActive === where.isActive);
        }
        if (where?.deletedAt === null) {
          results = results.filter((k) => k.deletedAt === null);
        }
        return results;
      },
    },

    followUp: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const followUp = {
          id,
          workspaceId: data.workspaceId,
          aiEmployeeId: data.aiEmployeeId ?? null,
          leadId: data.leadId ?? null,
          customerId: data.customerId ?? null,
          conversationId: data.conversationId ?? null,
          appointmentId: data.appointmentId ?? null,
          triggerType: data.triggerType,
          status: data.status ?? 'PENDING',
          scheduledAt: data.scheduledAt ?? null,
          attemptCount: data.attemptCount ?? 0,
          lastMessageSent: data.lastMessageSent ?? null,
          optedOut: data.optedOut ?? false,
          stopReason: data.stopReason ?? null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        followUps.set(id, followUp);
        return followUp;
      },
      findFirst: async ({ where }: any) => {
        let results = [...followUps.values()];
        if (where?.id !== undefined) {
          results = results.filter((f) => f.id === where.id);
        }
        if (where?.workspaceId !== undefined) {
          results = results.filter((f) => f.workspaceId === where.workspaceId);
        }
        if (where?.deletedAt === null) {
          results = results.filter((f) => f.deletedAt === null);
        }
        return results[0] ?? null;
      },
      findMany: async ({ where, orderBy }: any) => {
        let results = [...followUps.values()];
        if (where?.workspaceId !== undefined) {
          results = results.filter((f) => f.workspaceId === where.workspaceId);
        }
        if (where?.deletedAt === null) {
          results = results.filter((f) => f.deletedAt === null);
        }
        if (where?.status !== undefined) {
          results = results.filter((f) => f.status === where.status);
        }
        if (where?.leadId !== undefined) {
          results = results.filter((f) => f.leadId === where.leadId);
        }
        if (where?.customerId !== undefined) {
          results = results.filter((f) => f.customerId === where.customerId);
        }
        if (where?.conversationId !== undefined) {
          results = results.filter((f) => f.conversationId === where.conversationId);
        }
        if (where?.appointmentId !== undefined) {
          results = results.filter((f) => f.appointmentId === where.appointmentId);
        }
        if (where?.triggerType !== undefined) {
          results = results.filter((f) => f.triggerType === where.triggerType);
        }
        if (orderBy?.createdAt === 'desc') {
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return results;
      },
      update: async ({ where, data }: any) => {
        const followUp = followUps.get(where.id);
        if (!followUp) throw new Error('Mock: follow-up not found');
        Object.assign(followUp, data, { updatedAt: new Date() });
        return followUp;
      },
    },

    integration: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const integration = {
          id,
          workspaceId: data.workspaceId,
          provider: data.provider,
          status: data.status ?? 'DISCONNECTED',
          credentialsEncrypted: data.credentialsEncrypted ?? null,
          metadata: data.metadata ?? null,
          connectedByUserId: data.connectedByUserId ?? null,
          lastSyncedAt: data.lastSyncedAt ?? null,
          createdAt: now,
          updatedAt: now,
        };
        integrations.set(id, integration);
        return integration;
      },
      findUnique: async ({ where }: any) => {
        if (where.id !== undefined) {
          return integrations.get(where.id) ?? null;
        }
        const key = where.workspaceId_provider;
        if (key) {
          return [...integrations.values()].find(
            (i) => i.workspaceId === key.workspaceId && i.provider === key.provider
          ) ?? null;
        }
        return null;
      },
      findFirst: async ({ where }: any) => {
        let results = [...integrations.values()];
        if (where?.id !== undefined) {
          results = results.filter((i) => i.id === where.id);
        }
        if (where?.workspaceId !== undefined) {
          results = results.filter((i) => i.workspaceId === where.workspaceId);
        }
        if (where?.provider !== undefined) {
          results = results.filter((i) => i.provider === where.provider);
        }
        if (where?.status !== undefined) {
          results = results.filter((i) => i.status === where.status);
        }
        if (where?.metadata?.contains !== undefined) {
          results = results.filter((i) => i.metadata && i.metadata.includes(where.metadata.contains));
        }
        return results[0] ?? null;
      },
      findMany: async ({ where }: any) => {
        let results = [...integrations.values()];
        if (where?.workspaceId !== undefined) {
          results = results.filter((i) => i.workspaceId === where.workspaceId);
        }
        if (where?.provider !== undefined) {
          results = results.filter((i) => i.provider === where.provider);
        }
        if (where?.status !== undefined) {
          results = results.filter((i) => i.status === where.status);
        }
        return results;
      },
      upsert: async ({ where, create, update }: any) => {
        let integration = null;
        const key = where.workspaceId_provider;
        if (key) {
          integration = [...integrations.values()].find(
            (i) => i.workspaceId === key.workspaceId && i.provider === key.provider
          ) ?? null;
        }
        const now = new Date();
        if (integration) {
          Object.assign(integration, update, { updatedAt: now });
          return integration;
        } else {
          const id = randomUUID();
          const newIntegration = {
            id,
            workspaceId: create.workspaceId,
            provider: create.provider,
            status: create.status ?? 'DISCONNECTED',
            credentialsEncrypted: create.credentialsEncrypted ?? null,
            metadata: create.metadata ?? null,
            connectedByUserId: create.connectedByUserId ?? null,
            lastSyncedAt: create.lastSyncedAt ?? null,
            createdAt: now,
            updatedAt: now,
          };
          integrations.set(id, newIntegration);
          return newIntegration;
        }
      },
      update: async ({ where, data }: any) => {
        let integration = integrations.get(where.id);
        if (!integration && where.workspaceId_provider) {
          const key = where.workspaceId_provider;
          integration = [...integrations.values()].find(
            (i) => i.workspaceId === key.workspaceId && i.provider === key.provider
          ) ?? null;
        }
        if (!integration) throw new Error('Mock: integration not found');
        Object.assign(integration, data, { updatedAt: new Date() });
        return integration;
      },
    },

    notification: {
      create: async ({ data }: any) => {
        const id = randomUUID();
        const now = new Date();
        const notification = {
          id,
          workspaceId: data.workspaceId,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          payload: data.payload ?? null,
          readAt: null,
          sentVia: data.sentVia ?? 'IN_APP',
          createdAt: now,
          updatedAt: now,
        };
        notifications.set(id, notification);
        return notification;
      },
      findFirst: async ({ where }: any) => {
        let results = [...notifications.values()];
        if (where?.workspaceId !== undefined) {
          results = results.filter((n) => n.workspaceId === where.workspaceId);
        }
        if (where?.type !== undefined) {
          results = results.filter((n) => n.type === where.type);
        }
        if (where?.title !== undefined) {
          results = results.filter((n) => n.title === where.title);
        }
        return results[0] ?? null;
      },
      findMany: async ({ where }: any) => {
        let results = [...notifications.values()];
        if (where?.workspaceId !== undefined) {
          results = results.filter((n) => n.workspaceId === where.workspaceId);
        }
        if (where?.userId !== undefined) {
          results = results.filter((n) => n.userId === where.userId);
        }
        return results;
      },
    },

    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(client),
  };

  return client;
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;
