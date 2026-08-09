/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding development database...');

  // Users
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@aurora-dental.example' },
    update: {},
    create: {
      email: 'owner@aurora-dental.example',
      name: 'Jordan Ellis',
      authProviderId: 'seed-auth|owner-jordan-ellis',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@aurora-dental.example' },
    update: {},
    create: {
      email: 'admin@aurora-dental.example',
      name: 'Priya Nandan',
      authProviderId: 'seed-auth|admin-priya-nandan',
    },
  });

  const teamMemberUser = await prisma.user.upsert({
    where: { email: 'frontdesk@aurora-dental.example' },
    update: {},
    create: {
      email: 'frontdesk@aurora-dental.example',
      name: 'Sam Okafor',
      authProviderId: 'seed-auth|team-sam-okafor',
    },
  });

  // Organization
  const organization = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Aurora Dental Studio',
      industry: 'Healthcare — Dental',
      ownerUserId: ownerUser.id,
    },
  });

  // Workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      organizationId: organization.id,
      name: 'Aurora Dental Studio — Main Clinic',
      industry: 'Healthcare — Dental',
      timezone: 'America/New_York',
      branding: JSON.stringify({ primaryColor: '#2F6FED', logoUrl: null }),
      defaultWorkingHours: JSON.stringify({
        mon: ['09:00', '17:00'],
        tue: ['09:00', '17:00'],
        wed: ['09:00', '17:00'],
        thu: ['09:00', '17:00'],
        fri: ['09:00', '15:00'],
      }),
    },
  });

  // Workspace Members
  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: ownerUser.id, workspaceId: workspace.id } },
    update: {},
    create: {
      userId: ownerUser.id,
      workspaceId: workspace.id,
      role: 'OWNER',
      acceptedAt: new Date(),
    },
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: adminUser.id, workspaceId: workspace.id } },
    update: {},
    create: {
      userId: adminUser.id,
      workspaceId: workspace.id,
      role: 'ADMIN',
      acceptedAt: new Date(),
    },
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: teamMemberUser.id, workspaceId: workspace.id } },
    update: {},
    create: {
      userId: teamMemberUser.id,
      workspaceId: workspace.id,
      role: 'TEAM_MEMBER',
      acceptedAt: new Date(),
    },
  });

  // AI Employees
  const salesEmployee = await prisma.aIEmployee.upsert({
    where: { workspaceId_employeeType: { workspaceId: workspace.id, employeeType: 'SALES' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      employeeType: 'SALES',
      name: 'Ava — Sales',
      description: 'Qualifies inbound leads and books consultations.',
      status: 'ACTIVE',
      configuration: JSON.stringify({
        tone: 'friendly',
        qualificationQuestions: ['What treatment are you interested in?', 'Do you have insurance?'],
        escalateAfterMinutesNoResponse: 30,
      }),
      lastActiveAt: new Date(),
    },
  });

  const supportEmployee = await prisma.aIEmployee.upsert({
    where: { workspaceId_employeeType: { workspaceId: workspace.id, employeeType: 'SUPPORT' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      employeeType: 'SUPPORT',
      name: 'Nova — Support',
      description: 'Answers patient questions using the knowledge base.',
      status: 'ACTIVE',
      configuration: JSON.stringify({ tone: 'reassuring', escalateOnKeywords: ['emergency', 'in pain'] }),
      lastActiveAt: new Date(),
    },
  });

  const receptionistEmployee = await prisma.aIEmployee.upsert({
    where: { workspaceId_employeeType: { workspaceId: workspace.id, employeeType: 'RECEPTIONIST' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      employeeType: 'RECEPTIONIST',
      name: 'Remi — Receptionist',
      description: 'Books, reschedules, and confirms appointments.',
      status: 'NEEDS_SETUP',
      configuration: JSON.stringify({ bufferMinutesBetweenAppointments: 15 }),
    },
  });

  await prisma.aIEmployee.upsert({
    where: { workspaceId_employeeType: { workspaceId: workspace.id, employeeType: 'FOLLOW_UP' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      employeeType: 'FOLLOW_UP',
      name: 'Echo — Follow-up',
      description: 'Re-engages leads and patients who have gone quiet.',
      status: 'PAUSED',
      configuration: JSON.stringify({ noResponseDays: 3, channelPreference: 'WHATSAPP' }),
    },
  });

  // Integrations
  const whatsappIntegration = await prisma.integration.upsert({
    where: { workspaceId_provider: { workspaceId: workspace.id, provider: 'WHATSAPP' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      provider: 'WHATSAPP',
      status: 'CONNECTED',
      connectedByUserId: adminUser.id,
      metadata: JSON.stringify({ businessPhoneNumberMasked: '+1•••-•••-4821' }),
      lastSyncedAt: new Date(),
    },
  });

  await prisma.integration.upsert({
    where: { workspaceId_provider: { workspaceId: workspace.id, provider: 'GOOGLE_CALENDAR' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      provider: 'GOOGLE_CALENDAR',
      status: 'DISCONNECTED',
      metadata: JSON.stringify({}),
    },
  });

  // Knowledge Base
  const policyDocument = await prisma.document.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      workspaceId: workspace.id,
      fileName: 'cancellation-policy.pdf',
      fileUrl: 'https://storage.example.com/aurora-dental/cancellation-policy.pdf',
      fileType: 'application/pdf',
      uploadedByUserId: adminUser.id,
      processingStatus: 'PROCESSED',
    },
  });

  await prisma.knowledgeBaseEntry.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      workspaceId: workspace.id,
      type: 'POLICY',
      title: 'Cancellation Policy',
      content: 'Appointments can be cancelled or rescheduled free of charge up to 24 hours in advance.',
      documentId: policyDocument.id,
      syncStatus: 'SYNCED',
    },
  });

  await prisma.knowledgeBaseEntry.upsert({
    where: { id: '00000000-0000-0000-0000-000000000012' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000012',
      workspaceId: workspace.id,
      type: 'FAQ',
      title: 'Do you accept dental insurance?',
      content: 'Yes — we accept most major dental insurance plans. Bring your card to your first visit.',
      syncStatus: 'SYNCED',
    },
  });

  // Customers
  const returningCustomer = await prisma.customer.upsert({
    where: { id: '00000000-0000-0000-0000-000000000020' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000020',
      workspaceId: workspace.id,
      name: 'Morgan Reyes',
      email: 'morgan.reyes@example.com',
      phone: '+1-555-0142',
      sourceChannel: 'WhatsApp',
      firstContactAt: new Date('2026-05-02T14:00:00Z'),
      tags: JSON.stringify(['returning-patient']),
    },
  });

  // Leads
  const convertedLead = await prisma.lead.upsert({
    where: { id: '00000000-0000-0000-0000-000000000030' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000030',
      workspaceId: workspace.id,
      aiEmployeeId: salesEmployee.id,
      customerId: returningCustomer.id,
      status: 'WON',
      score: 'HOT',
      qualificationAnswers: JSON.stringify({ treatment: 'Teeth whitening', hasInsurance: true }),
      source: 'Website chat widget',
    },
  });

  const openLead = await prisma.lead.upsert({
    where: { id: '00000000-0000-0000-0000-000000000031' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000031',
      workspaceId: workspace.id,
      aiEmployeeId: salesEmployee.id,
      status: 'QUALIFYING',
      score: 'WARM',
      qualificationAnswers: JSON.stringify({ treatment: 'Invisalign consultation' }),
      source: 'WhatsApp',
      assignedUserId: adminUser.id,
    },
  });

  // Conversations
  const supportConversation = await prisma.conversation.upsert({
    where: { id: '00000000-0000-0000-0000-000000000040' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000040',
      workspaceId: workspace.id,
      customerId: returningCustomer.id,
      aiEmployeeId: supportEmployee.id,
      integrationId: whatsappIntegration.id,
      channel: 'WHATSAPP',
      status: 'RESOLVED',
      lastMessageAt: new Date('2026-07-20T10:05:00Z'),
    },
  });

  // Messages
  await prisma.message.create({
    data: {
      id: '00000000-0000-0000-0000-000000000041',
      conversationId: supportConversation.id,
      senderType: 'CUSTOMER',
      senderId: returningCustomer.id,
      content: 'Hi, do you accept my dental insurance?',
      messageType: 'TEXT',
      sentAt: new Date('2026-07-20T10:00:00Z'),
    },
  });

  await prisma.message.create({
    data: {
      id: '00000000-0000-0000-0000-000000000042',
      conversationId: supportConversation.id,
      senderType: 'AI_EMPLOYEE',
      senderId: supportEmployee.id,
      content: 'Yes! We accept most major dental insurance plans — just bring your card to your visit.',
      messageType: 'TEXT',
      sentAt: new Date('2026-07-20T10:01:30Z'),
    },
  });

  await prisma.message.create({
    data: {
      id: '00000000-0000-0000-0000-000000000043',
      conversationId: supportConversation.id,
      senderType: 'HUMAN_TEAM_MEMBER',
      senderId: teamMemberUser.id,
      content: 'Reviewed — resolved correctly by Nova, no action needed.',
      messageType: 'TEXT',
      isInternalNote: true,
      sentAt: new Date('2026-07-20T10:05:00Z'),
    },
  });

  const salesConversation = await prisma.conversation.upsert({
    where: { id: '00000000-0000-0000-0000-000000000044' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000044',
      workspaceId: workspace.id,
      leadId: openLead.id,
      aiEmployeeId: salesEmployee.id,
      channel: 'WEB_CHAT',
      status: 'OPEN',
      lastMessageAt: new Date('2026-08-05T09:15:00Z'),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: salesConversation.id,
      senderType: 'CUSTOMER',
      content: "Hi, I'm curious about Invisalign pricing.",
      messageType: 'TEXT',
      sentAt: new Date('2026-08-05T09:15:00Z'),
    },
  });

  // Appointments
  await prisma.appointment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000050' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000050',
      workspaceId: workspace.id,
      customerId: returningCustomer.id,
      leadId: convertedLead.id,
      aiEmployeeId: receptionistEmployee.id,
      startTime: new Date('2026-08-15T15:00:00Z'),
      endTime: new Date('2026-08-15T15:45:00Z'),
      status: 'SCHEDULED',
    },
  });

  // Notifications
  await prisma.notification.upsert({
    where: { id: '00000000-0000-0000-0000-000000000060' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000060',
      workspaceId: workspace.id,
      userId: adminUser.id,
      type: 'NEW_LEAD',
      title: 'New qualifying lead',
      message: 'A new lead is asking about Invisalign — currently being qualified by Ava.',
      payload: JSON.stringify({ leadId: openLead.id }),
      sentVia: 'IN_APP',
    },
  });

  console.log('✅ Seed complete!');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
