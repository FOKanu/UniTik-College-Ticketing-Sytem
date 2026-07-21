// Seed script for local development. See database/seed/README.md for what this seeds.
// No bcrypt/argon2 dependency is present in package.json, so passwordHash is left null
// rather than adding a new dependency for scaffold-only fake accounts.

import { prisma } from '../src/app/database/prisma';
import { logger } from '../src/app/shared/logger/logger';
import { Role, TicketStatus } from '@prisma/client';

async function main(): Promise<void> {
  const admin = await prisma.user.create({
    data: {
      email: 'elena.voss@university.edu',
      displayName: 'Elena Voss',
      role: Role.ADMIN,
      department: 'IT Administration',
      passwordHash: null,
    },
  });

  const staffTier1 = await prisma.user.create({
    data: {
      email: 'marcus.whitfield@university.edu',
      displayName: 'Marcus Whitfield',
      role: Role.STAFF,
      department: 'IT Support — Tier 1',
      passwordHash: null,
    },
  });

  const staffTier2 = await prisma.user.create({
    data: {
      email: 'priya.nandakumar@university.edu',
      displayName: 'Priya Nandakumar',
      role: Role.STAFF,
      department: 'IT Support — Tier 2',
      passwordHash: null,
    },
  });

  const studentJordan = await prisma.user.create({
    data: {
      email: 'jordan.alvarez@student.university.edu',
      displayName: 'Jordan Alvarez',
      role: Role.STUDENT,
      department: 'Computer Science',
      passwordHash: null,
    },
  });

  const studentSophie = await prisma.user.create({
    data: {
      email: 'sophie.tan@student.university.edu',
      displayName: 'Sophie Tan',
      role: Role.STUDENT,
      department: 'Biology',
      passwordHash: null,
    },
  });

  const studentLiam = await prisma.user.create({
    data: {
      email: 'liam.oconnor@student.university.edu',
      displayName: "Liam O'Connor",
      role: Role.STUDENT,
      department: 'Mechanical Engineering',
      passwordHash: null,
    },
  });

  const portalTicket = await prisma.ticket.create({
    data: {
      subject: 'Cannot access course portal',
      description: 'Login page redirects back to itself after entering valid credentials.',
      status: TicketStatus.OPEN,
      department: 'Computer Science',
      category: 'Access',
      createdBy: { connect: { id: studentJordan.id } },
      assignedTo: { connect: { id: staffTier1.id } },
    },
  });

  const wifiTicket = await prisma.ticket.create({
    data: {
      subject: 'Lab WiFi outage in Biology building',
      description: 'WiFi has been dropping every few minutes in the second-floor labs since Monday.',
      status: TicketStatus.IN_PROGRESS,
      department: 'Biology',
      category: 'Network',
      createdBy: { connect: { id: studentSophie.id } },
      assignedTo: { connect: { id: staffTier2.id } },
    },
  });

  const gradeAppealTicket = await prisma.ticket.create({
    data: {
      subject: 'Grade appeal not reflected in transcript',
      description: 'Approved grade change from last semester still shows the old grade on my transcript.',
      status: TicketStatus.RESOLVED,
      department: 'Mechanical Engineering',
      category: 'Academic Records',
      createdBy: { connect: { id: studentLiam.id } },
      assignedTo: { connect: { id: staffTier1.id } },
    },
  });

  const vpnTicket = await prisma.ticket.create({
    data: {
      subject: 'Intermittent VPN disconnects',
      description: 'VPN connection drops every 10-15 minutes when working from off campus.',
      status: TicketStatus.IN_PROGRESS,
      department: 'Computer Science',
      category: 'Network',
      createdBy: { connect: { id: studentJordan.id } },
      assignedTo: { connect: { id: staffTier2.id } },
    },
  });

  // Unclassified case: no department, no category set.
  const unclassifiedTicket = await prisma.ticket.create({
    data: {
      subject: 'App keeps crashing, not sure who to contact',
      description: 'The mobile app crashes on launch. Not sure which department handles this.',
      status: TicketStatus.OPEN,
      createdBy: { connect: { id: studentSophie.id } },
    },
  });

  const networkProblem = await prisma.problem.create({
    data: {
      title: 'Campus network instability affecting WiFi and VPN',
      rootCause:
        'Core switch firmware bug in Building C causing intermittent packet loss across wired and VPN-tunneled connections.',
      status: 'OPEN',
      owner: { connect: { id: staffTier2.id } },
      tickets: { connect: [{ id: wifiTicket.id }, { id: vpnTicket.id }] },
    },
  });

  const portalAttachment = await prisma.attachment.create({
    data: {
      ticket: { connect: { id: portalTicket.id } },
      filePath: 'attachments/tkt-portal-login/screenshot-login-error.png',
      fileType: 'png',
      fileSizeBytes: 482_331,
    },
  });

  logger.info(
    {
      users: 6,
      tickets: 5,
      problems: 1,
      attachments: 1,
      resolvedTicketId: gradeAppealTicket.id,
      unclassifiedTicketId: unclassifiedTicket.id,
      problemId: networkProblem.id,
      attachmentId: portalAttachment.id,
      admin: admin.email,
    },
    'Seed data created',
  );
}

main()
  .catch((error) => {
    logger.error(error, 'Seed script failed');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
