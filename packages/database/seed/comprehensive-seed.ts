import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, subDays, addMonths, subMonths } from 'date-fns';

// Import seed data
import { organizations } from './organizations';
import { usersData, rolePermissions } from './users';
import { clientsData, servicePackages } from './clients';
import { workflowTemplates } from './workflows';
import { engagementsData } from './engagements';
import { tasksData } from './tasks';
import { documentsData } from './documents';
import { invoicesData } from './invoices';
import { notesData } from './notes';
import { reportsData } from './reports';

const prisma = new PrismaClient();
const now = new Date();

// Organization IDs will be stored here for reference
const orgIds: Record<string, string> = {};
const userIds: Record<string, Record<string, string>> = {};
const clientIds: Record<string, Record<string, string>> = {};
const engagementIds: Record<string, Record<string, string>> = {};
const workflowIds: Record<string, Record<string, string>> = {};

async function main() {
  console.log('🌱 Starting comprehensive CPA platform seeding...\n');

  // Clear existing data (be careful in production!)
  console.log('🧹 Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.authEvent.deleteMany();
  await prisma.authAttempt.deleteMany();
  await prisma.teamMemberPermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.report.deleteMany();
  await prisma.note.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.task.deleteMany();
  await prisma.engagement.deleteMany();
  await prisma.document.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.client.deleteMany();
  await prisma.quickBooksToken.deleteMany();
  await prisma.quickBooksSync.deleteMany();
  await prisma.quickBooksWebhookEvent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Permissions
  console.log('📋 Creating permissions...');
  const permissions = await Promise.all([
    // User Management
    prisma.permission.create({
      data: { name: 'users:create', description: 'Create new users', category: 'user_management', action: 'create', resource: 'users' }
    }),
    prisma.permission.create({
      data: { name: 'users:read', description: 'View user information', category: 'user_management', action: 'read', resource: 'users' }
    }),
    prisma.permission.create({
      data: { name: 'users:update', description: 'Update user information', category: 'user_management', action: 'update', resource: 'users' }
    }),
    prisma.permission.create({
      data: { name: 'users:delete', description: 'Delete users', category: 'user_management', action: 'delete', resource: 'users' }
    }),
    // Client Management
    prisma.permission.create({
      data: { name: 'clients:create', description: 'Create new clients', category: 'client_management', action: 'create', resource: 'clients' }
    }),
    prisma.permission.create({
      data: { name: 'clients:read', description: 'View client information', category: 'client_management', action: 'read', resource: 'clients' }
    }),
    prisma.permission.create({
      data: { name: 'clients:update', description: 'Update client information', category: 'client_management', action: 'update', resource: 'clients' }
    }),
    prisma.permission.create({
      data: { name: 'clients:delete', description: 'Delete clients', category: 'client_management', action: 'delete', resource: 'clients' }
    }),
    // Document Management
    prisma.permission.create({
      data: { name: 'documents:create', description: 'Upload documents', category: 'document_management', action: 'create', resource: 'documents' }
    }),
    prisma.permission.create({
      data: { name: 'documents:read', description: 'View documents', category: 'document_management', action: 'read', resource: 'documents' }
    }),
    prisma.permission.create({
      data: { name: 'documents:update', description: 'Update documents', category: 'document_management', action: 'update', resource: 'documents' }
    }),
    prisma.permission.create({
      data: { name: 'documents:delete', description: 'Delete documents', category: 'document_management', action: 'delete', resource: 'documents' }
    }),
    // Invoicing
    prisma.permission.create({
      data: { name: 'invoices:create', description: 'Create invoices', category: 'billing', action: 'create', resource: 'invoices' }
    }),
    prisma.permission.create({
      data: { name: 'invoices:read', description: 'View invoices', category: 'billing', action: 'read', resource: 'invoices' }
    }),
    prisma.permission.create({
      data: { name: 'invoices:update', description: 'Update invoices', category: 'billing', action: 'update', resource: 'invoices' }
    }),
    // Reporting
    prisma.permission.create({
      data: { name: 'reports:create', description: 'Generate reports', category: 'reporting', action: 'create', resource: 'reports' }
    }),
    prisma.permission.create({
      data: { name: 'reports:read', description: 'View reports', category: 'reporting', action: 'read', resource: 'reports' }
    }),
    // Engagements
    prisma.permission.create({
      data: { name: 'engagements:create', description: 'Create engagements', category: 'engagement_management', action: 'create', resource: 'engagements' }
    }),
    prisma.permission.create({
      data: { name: 'engagements:read', description: 'View engagements', category: 'engagement_management', action: 'read', resource: 'engagements' }
    }),
    prisma.permission.create({
      data: { name: 'engagements:update', description: 'Update engagements', category: 'engagement_management', action: 'update', resource: 'engagements' }
    }),
  ]);

  // 2. Create Organizations
  console.log('🏢 Creating organizations...');
  for (const orgData of organizations) {
    const org = await prisma.organization.create({
      data: {
        name: orgData.name,
        subdomain: orgData.subdomain,
        subscriptionTier: orgData.subscriptionTier,
        stripeCustomerId: orgData.stripeCustomerId,
      }
    });
    orgIds[orgData.subdomain] = org.id;

    // Create subscription for each organization
    const periodStart = subMonths(now, 3);
    const periodEnd = addMonths(now, 9);

    await prisma.subscription.create({
      data: {
        organizationId: org.id,
        planName: orgData.subscriptionTier,
        planType: 'monthly',
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        stripeSubscriptionId: `sub_${orgData.subdomain}_demo`,
        stripePriceId: `price_${orgData.subscriptionTier}`,
        stripeCustomerId: orgData.stripeCustomerId,
        unitAmount: orgData.subscriptionTier === 'enterprise' ? 19940 : orgData.subscriptionTier === 'professional' ? 9940 : 2940,
        features: {
          users: orgData.subscriptionTier === 'enterprise' ? -1 : orgData.subscriptionTier === 'professional' ? 25 : 5,
          clients: orgData.subscriptionTier === 'enterprise' ? -1 : orgData.subscriptionTier === 'professional' ? 100 : 25,
          storage: orgData.subscriptionTier === 'enterprise' ? '1TB' : orgData.subscriptionTier === 'professional' ? '100GB' : '10GB',
        },
        limits: {
          maxUsers: orgData.subscriptionTier === 'enterprise' ? -1 : orgData.subscriptionTier === 'professional' ? 25 : 5,
          maxClients: orgData.subscriptionTier === 'enterprise' ? -1 : orgData.subscriptionTier === 'professional' ? 100 : 25,
          maxStorageGB: orgData.subscriptionTier === 'enterprise' ? 1000 : orgData.subscriptionTier === 'professional' ? 100 : 10,
        }
      }
    });
  }

  // 3. Create Users and Team Members
  console.log('👥 Creating users and team members...');
  const hashedPassword = await bcrypt.hash('demo123!', 10);

  for (const [orgSubdomain, users] of Object.entries(usersData)) {
    userIds[orgSubdomain] = {};

    for (const userData of users) {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          organizationId: orgIds[orgSubdomain],
          isActive: true,
          lastLoginAt: subDays(now, Math.floor(Math.random() * 7) + 1),
          createdBy: 'system',
          updatedBy: 'system'
        }
      });

      userIds[orgSubdomain][userData.email] = user.id;

      // Create team member record
      await prisma.teamMember.create({
        data: {
          userId: user.id,
          organizationId: orgIds[orgSubdomain],
          role: userData.role,
          department: userData.department,
          title: userData.title,
          specializations: userData.specializations,
          hourlyRate: userData.hourlyRate,
          hireDate: new Date(userData.hireDate),
          isActive: true,
          createdBy: 'system'
        }
      });
    }
  }

  // 4. Create Workflows
  console.log('⚡ Creating workflow templates...');
  for (const workflowData of workflowTemplates) {
    workflowIds['taxpro'] = workflowIds['taxpro'] || {};

    const workflow = await prisma.workflow.create({
      data: {
        name: workflowData.name,
        description: workflowData.description,
        type: workflowData.type,
        isTemplate: workflowData.isTemplate,
        isActive: workflowData.isActive,
        version: workflowData.version,
        organizationId: orgIds['taxpro'], // Primary org for templates
        steps: workflowData.steps,
        settings: workflowData.settings,
        createdBy: 'system'
      }
    });

    workflowIds['taxpro'][workflowData.name] = workflow.id;
  }

  // 5. Create Clients
  console.log('🤝 Creating clients...');
  for (const [orgSubdomain, clients] of Object.entries(clientsData)) {
    clientIds[orgSubdomain] = {};

    for (const clientData of clients) {
      const client = await prisma.client.create({
        data: {
          businessName: clientData.businessName,
          legalName: clientData.legalName,
          taxId: clientData.taxId,
          quickbooksId: clientData.quickbooksId,
          organizationId: orgIds[orgSubdomain],
          primaryContactEmail: clientData.primaryContactEmail,
          primaryContactName: clientData.primaryContactName,
          primaryContactPhone: clientData.primaryContactPhone,
          businessAddress: clientData.businessAddress,
          mailingAddress: clientData.mailingAddress,
          businessType: clientData.businessType,
          industry: clientData.industry,
          website: clientData.website,
          status: clientData.status,
          riskLevel: clientData.riskLevel,
          annualRevenue: clientData.annualRevenue,
          customFields: {
            employeeCount: clientData.employeeCount,
            yearEstablished: clientData.yearEstablished,
            servicePackage: clientData.servicePackage,
            billingFrequency: clientData.billingFrequency
          },
          createdBy: 'system',
          updatedBy: 'system'
        }
      });

      clientIds[orgSubdomain][clientData.businessName] = client.id;
    }
  }

  // 6. Create Engagements
  console.log('📊 Creating engagements...');
  for (const [orgSubdomain, engagements] of Object.entries(engagementsData)) {
    engagementIds[orgSubdomain] = {};

    for (const engagementData of engagements) {
      // Find client by matching business name pattern
      const clientName = Object.keys(clientIds[orgSubdomain]).find(name =>
        engagementData.name.includes(name.split(' ')[0]) ||
        engagementData.name.includes(name.split(' ')[1])
      );

      if (!clientName) continue;

      // Get first user of this org as creator/assignee
      const userEmail = Object.keys(userIds[orgSubdomain])[0];
      const assigneeEmail = Object.keys(userIds[orgSubdomain])[Math.floor(Math.random() * Object.keys(userIds[orgSubdomain]).length)];

      const engagement = await prisma.engagement.create({
        data: {
          name: engagementData.name,
          description: engagementData.description,
          type: engagementData.type,
          status: engagementData.status,
          priority: engagementData.priority,
          startDate: engagementData.startDate,
          dueDate: engagementData.dueDate,
          completedDate: engagementData.completedDate,
          estimatedHours: engagementData.estimatedHours,
          actualHours: engagementData.actualHours,
          hourlyRate: engagementData.hourlyRate,
          fixedFee: engagementData.fixedFee,
          clientId: clientIds[orgSubdomain][clientName],
          organizationId: orgIds[orgSubdomain],
          assignedToId: userIds[orgSubdomain][assigneeEmail],
          createdById: userIds[orgSubdomain][userEmail],
          year: engagementData.year,
          quarter: engagementData.quarter,
          customFields: engagementData.customFields,
          createdBy: userIds[orgSubdomain][userEmail],
          updatedBy: userIds[orgSubdomain][userEmail]
        }
      });

      engagementIds[orgSubdomain][engagementData.name] = engagement.id;
    }
  }

  // 7. Create Tasks
  console.log('✅ Creating tasks...');
  for (const [orgSubdomain, taskGroups] of Object.entries(tasksData)) {
    for (const taskGroup of taskGroups) {
      const engagementId = engagementIds[orgSubdomain]?.[taskGroup.engagementName];
      if (!engagementId) continue;

      const userEmails = Object.keys(userIds[orgSubdomain]);
      const creatorEmail = userEmails[0];

      for (const taskData of taskGroup.tasks) {
        // Find assignee by role
        const assigneeEmail = userEmails.find(email => {
          const userData = Object.values(usersData[orgSubdomain]).find(u => u.email === email);
          return userData?.role === taskData.assignedRole;
        }) || userEmails[0];

        await prisma.task.create({
          data: {
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            priority: taskData.priority,
            taskType: taskData.taskType,
            estimatedHours: taskData.estimatedHours,
            actualHours: taskData.actualHours,
            startDate: taskData.startDate,
            dueDate: taskData.dueDate,
            completedDate: taskData.completedDate,
            assignedToId: userIds[orgSubdomain][assigneeEmail],
            createdById: userIds[orgSubdomain][creatorEmail],
            engagementId: engagementId,
            organizationId: orgIds[orgSubdomain],
            checklist: taskData.checklist,
            attachments: taskData.attachments,
            createdBy: userIds[orgSubdomain][creatorEmail],
            updatedBy: userIds[orgSubdomain][assigneeEmail]
          }
        });
      }
    }
  }

  // 8. Create Documents
  console.log('📄 Creating documents...');
  for (const [orgSubdomain, clientDocuments] of Object.entries(documentsData)) {
    for (const clientDocGroup of clientDocuments) {
      const clientId = clientIds[orgSubdomain]?.[clientDocGroup.clientName];
      if (!clientId) continue;

      const userEmails = Object.keys(userIds[orgSubdomain]);

      for (const docData of clientDocGroup.documents) {
        // Find uploader by role
        const uploaderEmail = userEmails.find(email => {
          const userData = Object.values(usersData[orgSubdomain]).find(u => u.email === email);
          return userData?.role === docData.uploadedBy;
        }) || userEmails[0];

        await prisma.document.create({
          data: {
            fileName: docData.fileName,
            fileUrl: docData.fileUrl,
            fileType: docData.fileType,
            mimeType: docData.mimeType,
            fileSize: BigInt(docData.fileSize),
            category: docData.category,
            subcategory: docData.subcategory,
            year: docData.year,
            quarter: docData.quarter,
            version: docData.version,
            isLatestVersion: docData.isLatestVersion,
            tags: docData.tags,
            description: docData.description,
            clientId: clientId,
            organizationId: orgIds[orgSubdomain],
            uploadedBy: userIds[orgSubdomain][uploaderEmail],
            extractedData: docData.extractedData,
            metadata: docData.metadata,
            checksum: docData.checksum,
            isConfidential: docData.isConfidential,
            retentionDate: docData.retentionDate,
            createdBy: userIds[orgSubdomain][uploaderEmail],
            updatedBy: userIds[orgSubdomain][uploaderEmail]
          }
        });
      }
    }
  }

  // 9. Create Invoices
  console.log('💰 Creating invoices...');
  for (const [orgSubdomain, clientInvoices] of Object.entries(invoicesData)) {
    for (const clientInvoiceGroup of clientInvoices) {
      const clientId = clientIds[orgSubdomain]?.[clientInvoiceGroup.clientName];
      const engagementId = engagementIds[orgSubdomain]?.[clientInvoiceGroup.engagementName];
      if (!clientId) continue;

      const userEmails = Object.keys(userIds[orgSubdomain]);
      const creatorEmail = userEmails[0];

      for (const invoiceData of clientInvoiceGroup.invoices) {
        await prisma.invoice.create({
          data: {
            invoiceNumber: invoiceData.invoiceNumber,
            title: invoiceData.title,
            description: invoiceData.description,
            status: invoiceData.status,
            invoiceDate: invoiceData.invoiceDate,
            dueDate: invoiceData.dueDate,
            subtotal: invoiceData.subtotal,
            taxAmount: invoiceData.taxAmount,
            discountAmount: invoiceData.discountAmount,
            totalAmount: invoiceData.totalAmount,
            paidAmount: invoiceData.paidAmount,
            balanceAmount: invoiceData.balanceAmount,
            currency: invoiceData.currency,
            paymentTerms: invoiceData.paymentTerms,
            clientId: clientId,
            engagementId: engagementId,
            organizationId: orgIds[orgSubdomain],
            createdById: userIds[orgSubdomain][creatorEmail],
            lineItems: invoiceData.lineItems,
            paymentHistory: invoiceData.paymentHistory,
            emailHistory: invoiceData.emailHistory,
            sentAt: invoiceData.sentAt,
            viewedAt: invoiceData.viewedAt,
            paidAt: invoiceData.paidAt,
            notes: invoiceData.notes,
            createdBy: userIds[orgSubdomain][creatorEmail],
            updatedBy: userIds[orgSubdomain][creatorEmail]
          }
        });
      }
    }
  }

  // 10. Create Notes
  console.log('📝 Creating notes...');
  for (const [orgSubdomain, clientNotes] of Object.entries(notesData)) {
    for (const clientNoteGroup of clientNotes) {
      const clientId = clientIds[orgSubdomain]?.[clientNoteGroup.clientName];
      const engagementId = engagementIds[orgSubdomain]?.[clientNoteGroup.engagementName];
      if (!clientId) continue;

      for (const noteData of clientNoteGroup.notes) {
        // Find author by role
        const userEmails = Object.keys(userIds[orgSubdomain]);
        const authorEmail = userEmails.find(email => {
          const userData = Object.values(usersData[orgSubdomain]).find(u => u.email === email);
          return userData?.role === noteData.authorRole;
        }) || userEmails[0];

        await prisma.note.create({
          data: {
            title: noteData.title,
            content: noteData.content,
            noteType: noteData.noteType,
            priority: noteData.priority,
            isPrivate: noteData.isPrivate,
            tags: noteData.tags,
            clientId: clientId,
            engagementId: engagementId,
            authorId: userIds[orgSubdomain][authorEmail],
            reminderDate: noteData.reminderDate,
            createdAt: noteData.createdAt,
            createdBy: userIds[orgSubdomain][authorEmail],
            updatedBy: userIds[orgSubdomain][authorEmail]
          }
        });
      }
    }
  }

  // 11. Create Reports
  console.log('📈 Creating reports...');
  for (const [orgSubdomain, reports] of Object.entries(reportsData)) {
    const userEmails = Object.keys(userIds[orgSubdomain]);

    for (const reportData of reports) {
      // Find creator by role
      const creatorEmail = userEmails.find(email => {
        const userData = Object.values(usersData[orgSubdomain]).find(u => u.email === email);
        return userData?.role === reportData.authorRole;
      }) || userEmails[0];

      await prisma.report.create({
        data: {
          name: reportData.name,
          description: reportData.description,
          reportType: reportData.reportType,
          format: reportData.format,
          status: reportData.status,
          fileUrl: reportData.fileUrl,
          fileSize: BigInt(reportData.fileSize),
          parameters: reportData.parameters,
          data: reportData.data,
          metadata: reportData.metadata,
          organizationId: orgIds[orgSubdomain],
          createdById: userIds[orgSubdomain][creatorEmail],
          generatedAt: reportData.generatedAt,
          expiresAt: reportData.expiresAt,
          downloadCount: reportData.downloadCount,
          createdBy: userIds[orgSubdomain][creatorEmail],
          updatedBy: userIds[orgSubdomain][creatorEmail]
        }
      });
    }
  }

  // 12. Create Sample Audit Logs
  console.log('📋 Creating audit logs...');
  for (const orgSubdomain of Object.keys(orgIds)) {
    const userEmails = Object.keys(userIds[orgSubdomain]);
    const mainUserEmail = userEmails[0];

    // Recent login
    await prisma.auditLog.create({
      data: {
        action: 'login',
        entityType: 'user',
        entityId: userIds[orgSubdomain][mainUserEmail],
        newValues: { loginTime: new Date().toISOString() },
        metadata: { source: 'web_app', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        ipAddress: '192.168.1.100',
        sessionId: `sess_${orgSubdomain}_demo`,
        organizationId: orgIds[orgSubdomain],
        userId: userIds[orgSubdomain][mainUserEmail]
      }
    });

    // Sample client creation
    const firstClientId = Object.values(clientIds[orgSubdomain])[0];
    await prisma.auditLog.create({
      data: {
        action: 'create',
        entityType: 'client',
        entityId: firstClientId,
        newValues: { status: 'active', businessName: Object.keys(clientIds[orgSubdomain])[0] },
        metadata: { source: 'web_app' },
        ipAddress: '192.168.1.100',
        organizationId: orgIds[orgSubdomain],
        userId: userIds[orgSubdomain][mainUserEmail]
      }
    });
  }

  // 13. Create Auth Events
  console.log('🔐 Creating auth events...');
  for (const orgSubdomain of Object.keys(orgIds)) {
    const userEmails = Object.keys(userIds[orgSubdomain]);

    for (const userEmail of userEmails.slice(0, 3)) { // Just first 3 users
      await prisma.authEvent.create({
        data: {
          eventType: 'login',
          success: true,
          description: 'Successful login',
          ipAddress: '192.168.1.' + (100 + Math.floor(Math.random() * 50)),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          organizationId: orgIds[orgSubdomain],
          userId: userIds[orgSubdomain][userEmail],
          sessionId: `sess_${userEmail.split('@')[0]}_demo`,
          metadata: { loginMethod: 'email_password', mfaUsed: false },
          createdAt: subDays(now, Math.floor(Math.random() * 30))
        }
      });
    }
  }

  console.log('\n✅ Comprehensive CPA platform seeding completed successfully!\n');

  // Print summary
  console.log('📊 SEEDING SUMMARY:');
  console.log('==================');
  console.log(`🏢 Organizations: ${organizations.length}`);
  console.log(`👥 Users: ${Object.values(usersData).flat().length}`);
  console.log(`🤝 Clients: ${Object.values(clientsData).flat().length}`);
  console.log(`⚡ Workflows: ${workflowTemplates.length}`);
  console.log(`📊 Engagements: ${Object.values(engagementsData).flat().length}`);
  console.log(`✅ Tasks: ${Object.values(tasksData).flat().reduce((acc, curr) => acc + curr.tasks.length, 0)}`);
  console.log(`📄 Documents: ${Object.values(documentsData).flat().reduce((acc, curr) => acc + curr.documents.length, 0)}`);
  console.log(`💰 Invoices: ${Object.values(invoicesData).flat().reduce((acc, curr) => acc + curr.invoices.length, 0)}`);
  console.log(`📝 Notes: ${Object.values(notesData).flat().reduce((acc, curr) => acc + curr.notes.length, 0)}`);
  console.log(`📈 Reports: ${Object.values(reportsData).flat().length}`);
  console.log(`📋 Permissions: ${permissions.length}`);
  console.log(`💳 Subscriptions: ${organizations.length}`);

  console.log('\n🎯 DEMO ORGANIZATIONS:');
  console.log('======================');
  for (const org of organizations) {
    console.log(`\n${org.name} (${org.subscriptionTier.toUpperCase()})`);
    console.log(`  └─ Subdomain: ${org.subdomain}.advisoros.com`);
    console.log(`  └─ Team Size: ${org.teamSize} members`);
    console.log(`  └─ Location: ${org.location}`);
    console.log(`  └─ Login: Any user email with password "demo123!"`);
  }

  console.log('\n🔑 LOGIN CREDENTIALS:');
  console.log('=====================');
  console.log('Password for all demo users: demo123!');
  console.log('\nSample login emails:');
  for (const [orgSubdomain, users] of Object.entries(usersData)) {
    console.log(`\n${organizations.find(o => o.subdomain === orgSubdomain)?.name}:`);
    users.slice(0, 3).forEach(user => {
      console.log(`  └─ ${user.email} (${user.role})`);
    });
  }
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed with error:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });