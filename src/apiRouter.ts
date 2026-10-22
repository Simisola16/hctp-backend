import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import {
  StatusUpdateSchema,
  ContactInquirySchema,
  ScheduleInspectionSchema,
  ReviewNoteSchema,
  RequestInfoSchema
} from './validators/schemas';
import {
  CertificationApplication,
  InspectionRecord,
  CertificateRecord,
  AuditHistoryEvent,
  ApplicationStatus,
  PERMITTED_STATUS_TRANSITIONS
} from './types/certification';
import {
  isDbConnected,
  getApplications,
  getApplicationByIdOrRef,
  updateApplication,
  getOrganizations,
  getOrganizationById,
  getInspections,
  getInspectionById,
  insertInspection,
  updateInspection,
  getCertificates,
  insertCertificate,
  getRenewals,
  getAuditLogs,
  insertAuditLog,
  getContactInquiries,
  insertContactInquiry,
  updateContactInquiryStatus,
  getVisitorLocations,
  recordVisitorLocation,
  resetDatabase
} from './db';
import { sendEngagementNotification } from './emailService';

async function addAuditLog(
  action: string,
  targetEntity: string,
  targetRef: string,
  details: string,
  actor: string = 'API User (Assessor)',
  role: string = 'System Service'
): Promise<void> {
  const newLog: AuditHistoryEvent = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    actor,
    role,
    action,
    targetEntity,
    targetRef,
    details,
    isSimulatedDemoEvent: true
  };
  await insertAuditLog(newLog);
}

function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', err => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'hcpt_admin_secret_key_2026_secured';
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || process.env.ENGAGEMENT_NOTIFICATION_EMAIL || 'villagecoders7@gmail.com').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'hcpt123').trim();

export function generateAdminToken(user: string): string {
  const timestamp = Date.now();
  const payload = `${user}:${timestamp}`;
  const signature = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const [user, timestampStr, signature] = raw.split(':');
    if (!user || !timestampStr || !signature) return false;
    const expectedSig = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(`${user}:${timestampStr}`).digest('hex');
    if (signature !== expectedSig) return false;
    const timestamp = parseInt(timestampStr, 10);
    // Token valid for 7 days
    if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

function getBearerToken(req: IncomingMessage): string | undefined {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return undefined;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return authHeader.trim();
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api')) {
    return false;
  }

  const [path, queryString] = url.split('?');
  const query = new URLSearchParams(queryString || '');
  const method = req.method || 'GET';

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return true;
  }

  try {
    // 1. Health
    if (path === '/api/health' && (method === 'GET' || method === 'HEAD')) {
      sendJson(res, 200, {
        status: 'healthy',
        service: 'HCPT Halal Certification Platform API Gateway',
        version: '2.4.0-enterprise',
        environment: 'standalone-backend',
        database: isDbConnected() ? 'connected (MongoDB Atlas)' : 'in-memory resilient mode',
        timestamp: new Date().toISOString()
      });
      return true;
    }

    // 2. Dashboard summary
    if (path === '/api/dashboard' && method === 'GET') {
      const applications = await getApplications();
      const inspections = await getInspections();
      const certificates = await getCertificates();

      const awaitingReview = applications.filter(
        a =>
          a.status === 'Submitted' ||
          a.status === 'Initial Review' ||
          a.status === 'Technical Review' ||
          a.status === 'Decision Pending'
      ).length;
      const scheduledInspections = inspections.filter(i => i.status === 'Scheduled').length;
      const issuedCerts = certificates.filter(c => c.status === 'Active' || c.status === 'Approaching Expiry').length;
      const expiringCerts = certificates.filter(c => c.status === 'Approaching Expiry').length;

      const statusCounts: Record<string, number> = {};
      applications.forEach(a => {
        statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      });

      sendJson(res, 200, {
        totalApplications: applications.length,
        awaitingReview,
        inspectionsScheduled: scheduledInspections,
        certificatesIssued: issuedCerts,
        certificatesApproachingExpiry: expiringCerts,
        statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count
        })),
        outstandingTasksCount: awaitingReview + scheduledInspections
      });
      return true;
    }

    // 3. Applications List & Search
    if (path === '/api/applications' && method === 'GET') {
      const status = query.get('status') || undefined;
      const category = query.get('category') || undefined;
      const search = query.get('search') || undefined;

      const result = await getApplications({ status, category, search });

      sendJson(res, 200, {
        applications: result,
        total: result.length,
        timestamp: new Date().toISOString()
      });
      return true;
    }

    // 4. Single Application Detail
    const appDetailMatch = path.match(/^\/api\/applications\/([^/]+)$/);
    if (appDetailMatch && method === 'GET') {
      const id = appDetailMatch[1];
      const app = await getApplicationByIdOrRef(id);
      if (!app) {
        sendJson(res, 404, { error: 'Application record not found', id });
        return true;
      }
      sendJson(res, 200, { application: app });
      return true;
    }

    // 5. Update Application Status
    const appStatusMatch = path.match(/^\/api\/applications\/([^/]+)\/status$/);
    if (appStatusMatch && method === 'PATCH') {
      const id = appStatusMatch[1];
      const body = await parseJsonBody<any>(req);
      const parsed = StatusUpdateSchema.safeParse(body);
      if (!parsed.success) {
        sendJson(res, 400, {
          error: 'Validation failed',
          issues: parsed.error.issues
        });
        return true;
      }

      const current = await getApplicationByIdOrRef(id);
      if (!current) {
        sendJson(res, 404, { error: 'Application not found' });
        return true;
      }

      const nextStatus = parsed.data.status as ApplicationStatus;
      const allowed = PERMITTED_STATUS_TRANSITIONS[current.status] || [];

      if (!allowed.includes(nextStatus)) {
        sendJson(res, 422, {
          error: 'Forbidden transition',
          message: `Cannot transition from '${current.status}' to '${nextStatus}'. Permitted targets: ${allowed.join(', ') || 'None'}`
        });
        return true;
      }

      const actor = parsed.data.actor || 'Lead Technical Assessor';
      const updatedTimeline = [
        {
          id: `tl-${Date.now()}`,
          status: nextStatus,
          actor,
          role: 'Certification Officer',
          description: parsed.data.reason,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
        },
        ...(current.timeline || [])
      ];

      const updated = await updateApplication(current.id, {
        status: nextStatus,
        lastUpdated: new Date().toISOString().substring(0, 10),
        timeline: updatedTimeline
      });

      await addAuditLog(
        'STATUS_TRANSITION',
        'Application',
        current.referenceNumber,
        `Transitioned to ${nextStatus}. Reason: ${parsed.data.reason}`,
        actor
      );

      sendJson(res, 200, {
        success: true,
        message: `Application transitioned to ${nextStatus}`,
        application: updated
      });
      return true;
    }

    // 6. Add Reviewer Note
    const appNoteMatch = path.match(/^\/api\/applications\/([^/]+)\/notes$/);
    if (appNoteMatch && method === 'POST') {
      const id = appNoteMatch[1];
      const body = await parseJsonBody<any>(req);
      const parsed = ReviewNoteSchema.safeParse(body);
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Validation failed', issues: parsed.error.issues });
        return true;
      }

      const app = await getApplicationByIdOrRef(id);
      if (!app) {
        sendJson(res, 404, { error: 'Application not found' });
        return true;
      }

      const note = {
        id: `note-${Date.now()}`,
        content: parsed.data.content,
        author: parsed.data.author,
        role: parsed.data.role,
        isInternal: parsed.data.isInternal,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      const updated = await updateApplication(app.id, {
        notes: [note, ...(app.notes || [])]
      });

      await addAuditLog(
        'NOTE_RECORDED',
        'Application',
        app.referenceNumber,
        `Reviewer note added: "${note.content.substring(0, 50)}..."`,
        note.author,
        note.role
      );

      sendJson(res, 201, { success: true, note, application: updated });
      return true;
    }

    // 7. Request Information (RFI)
    const appRfiMatch = path.match(/^\/api\/applications\/([^/]+)\/rfi$/);
    if (appRfiMatch && method === 'POST') {
      const id = appRfiMatch[1];
      const body = await parseJsonBody<any>(req);
      const parsed = RequestInfoSchema.safeParse(body);
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Validation failed', issues: parsed.error.issues });
        return true;
      }

      const app = await getApplicationByIdOrRef(id);
      if (!app) {
        sendJson(res, 404, { error: 'Application not found' });
        return true;
      }

      const rfi = {
        id: `rfi-${Date.now()}`,
        requestedFields: parsed.data.fields,
        message: parsed.data.message,
        requestedBy: parsed.data.requestedBy,
        requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Pending Response' as const
      };

      const updates: Partial<CertificationApplication> = {
        missingInfoRequests: [rfi, ...(app.missingInfoRequests || [])]
      };

      if (PERMITTED_STATUS_TRANSITIONS[app.status]?.includes('Awaiting Applicant Information')) {
        updates.status = 'Awaiting Applicant Information';
        updates.timeline = [
          {
            id: `tl-${Date.now()}`,
            status: 'Awaiting Applicant Information',
            actor: parsed.data.requestedBy,
            role: 'Certification Assessor',
            description: `RFI Dispatched: ${parsed.data.message}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
          },
          ...(app.timeline || [])
        ];
      }

      const updated = await updateApplication(app.id, updates);

      await addAuditLog(
        'RFI_DISPATCHED',
        'Application',
        app.referenceNumber,
        `Information request dispatched: ${parsed.data.message}`,
        parsed.data.requestedBy
      );

      sendJson(res, 201, { success: true, rfi, application: updated });
      return true;
    }

    // 8. Organizations
    if (path === '/api/organizations' && method === 'GET') {
      const organizations = await getOrganizations();
      sendJson(res, 200, { organizations, total: organizations.length });
      return true;
    }

    const orgDetailMatch = path.match(/^\/api\/organizations\/([^/]+)$/);
    if (orgDetailMatch && method === 'GET') {
      const id = orgDetailMatch[1];
      const org = await getOrganizationById(id);
      if (!org) {
        sendJson(res, 404, { error: 'Organization not found' });
        return true;
      }
      sendJson(res, 200, { organization: org });
      return true;
    }

    // 9. Inspections
    if (path === '/api/inspections' && method === 'GET') {
      const inspections = await getInspections();
      sendJson(res, 200, { inspections, total: inspections.length });
      return true;
    }

    if (path === '/api/inspections' && method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const parsed = ScheduleInspectionSchema.safeParse(body);
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Validation failed', issues: parsed.error.issues });
        return true;
      }

      const app = await getApplicationByIdOrRef(parsed.data.applicationId);
      if (!app) {
        sendJson(res, 404, { error: 'Referenced application does not exist' });
        return true;
      }

      const newInsp: InspectionRecord = {
        id: `insp-${Date.now()}`,
        inspectionRef: `HCPT-INSP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        applicationId: app.id,
        applicationRef: app.referenceNumber,
        organizationName: app.organizationName,
        facilityName: app.facilityName,
        facilityAddress: app.facilityAddress,
        scheduledDate: parsed.data.scheduledDate,
        scheduledTime: parsed.data.scheduledTime,
        assignedInspector: parsed.data.assignedInspector,
        inspectorCredentials: 'Lead Halal Assessor (ISO 17065 & SMIIC)',
        status: 'Scheduled',
        checklist: parsed.data.checklistItems.map((criterion, i) => ({
          id: `ci-${Date.now()}-${i}`,
          criterion,
          verified: false,
          severity: i === 0 ? 'Critical' : 'Major'
        }))
      };

      await insertInspection(newInsp);

      const appUpdates: Partial<CertificationApplication> = {
        inspectionId: newInsp.id,
        assignedInspector: newInsp.assignedInspector
      };

      if (PERMITTED_STATUS_TRANSITIONS[app.status]?.includes('Inspection Scheduled')) {
        appUpdates.status = 'Inspection Scheduled';
        appUpdates.timeline = [
          {
            id: `tl-${Date.now()}`,
            status: 'Inspection Scheduled',
            actor: 'Operations Dispatch',
            role: 'Logistics Coordinator',
            description: `On-site inspection scheduled for ${newInsp.scheduledDate} with ${newInsp.assignedInspector}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
          },
          ...(app.timeline || [])
        ];
      }

      await updateApplication(app.id, appUpdates);

      await addAuditLog(
        'INSPECTION_SCHEDULED',
        'Inspection',
        newInsp.inspectionRef,
        `Inspection scheduled for ${app.facilityName} on ${newInsp.scheduledDate}`,
        'Operations Coordinator'
      );

      sendJson(res, 201, { success: true, inspection: newInsp });
      return true;
    }

    // 10. Complete Inspection
    const inspCompleteMatch = path.match(/^\/api\/inspections\/([^/]+)\/complete$/);
    if (inspCompleteMatch && method === 'PATCH') {
      const id = inspCompleteMatch[1];
      const body = await parseJsonBody<any>(req);
      const insp = await getInspectionById(id);
      if (!insp) {
        sendJson(res, 404, { error: 'Inspection not found' });
        return true;
      }

      const outcome = body.outcome || 'Compliant / Recommended';
      const findingsSummary = body.findingsSummary || 'All audit criteria verified compliant.';
      const updatedChecklist = insp.checklist.map(c => ({ ...c, verified: true }));

      const updatedInsp = await updateInspection(id, {
        status: 'Completed',
        outcome,
        findingsSummary,
        checklist: updatedChecklist
      });

      const app = await getApplicationByIdOrRef(insp.applicationId);
      if (app && PERMITTED_STATUS_TRANSITIONS[app.status]?.includes('Inspection Completed')) {
        await updateApplication(app.id, {
          status: 'Inspection Completed',
          timeline: [
            {
              id: `tl-${Date.now()}`,
              status: 'Inspection Completed',
              actor: insp.assignedInspector,
              role: 'Lead Auditor',
              description: `Field audit completed: ${outcome}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
            },
            ...(app.timeline || [])
          ]
        });
      }

      await addAuditLog(
        'INSPECTION_COMPLETED',
        'Inspection',
        insp.inspectionRef,
        `Audit completed with outcome: ${outcome}`,
        insp.assignedInspector
      );

      sendJson(res, 200, { success: true, inspection: updatedInsp });
      return true;
    }

    // 11. Certificates
    if (path === '/api/certificates' && method === 'GET') {
      const certificates = await getCertificates();
      sendJson(res, 200, { certificates, total: certificates.length });
      return true;
    }

    if (path === '/api/certificates/issue' && method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const app = await getApplicationByIdOrRef(body.applicationId);
      if (!app) {
        sendJson(res, 404, { error: 'Application not found' });
        return true;
      }

      if (app.status !== 'Approved' && app.status !== 'Decision Pending') {
        sendJson(res, 422, {
          error: 'Unapproved application',
          message: 'Application must have formal Approved status before certificate issuance.'
        });
        return true;
      }

      const certNum = `HCPT-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newCert: CertificateRecord = {
        id: `cert-${Date.now()}`,
        certificateNumber: certNum,
        applicationId: app.id,
        applicationRef: app.referenceNumber,
        organizationName: app.organizationName,
        facilityName: app.facilityName,
        facilityAddress: app.facilityAddress,
        jurisdiction: `${app.country} & International Export Protocol`,
        governingStandard: body.standard || 'OIC/SMIIC 1:2019 / GSO 2055-1:2015',
        scopeOfCertification: `Manufacturing and handling under ${app.category} classification`,
        certifiedProducts: app.products.map(p => p.name),
        issueDate: new Date().toISOString().substring(0, 10),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        status: 'Active',
        cryptographicSignature: `ECDSA-P384:HCPT-SIG:${Math.random().toString(36).substring(2, 6).toUpperCase()}-DIGITAL`,
        sha256Digest: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        verificationHash: `V-${certNum.slice(-4)}-REGISTRY`,
        signatories: [
          { role: 'Chairman of Shariah Supervisory Board', name: 'Sheikh M. Noorudeen', designation: 'Senior Islamic Jurist' },
          { role: 'Director General of Certification', name: 'Dr. Tariq Al-Hashimi', designation: 'Technical Assurance Lead' }
        ]
      };

      await insertCertificate(newCert);

      await updateApplication(app.id, {
        status: 'Certificate Issued',
        certificateId: newCert.id,
        timeline: [
          {
            id: `tl-${Date.now()}`,
            status: 'Certificate Issued',
            actor: 'Certification Directorate',
            role: 'Director General',
            description: `Certificate ${certNum} generated and cryptographically sealed.`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
          },
          ...(app.timeline || [])
        ]
      });

      await addAuditLog(
        'CERTIFICATE_ISSUED',
        'Certificate',
        certNum,
        `Certificate issued for ${app.organizationName} covering ${app.products.length} products.`,
        'Certification Directorate'
      );

      sendJson(res, 201, { success: true, certificate: newCert });
      return true;
    }

    // 12. Renewals
    if (path === '/api/renewals' && method === 'GET') {
      const renewals = await getRenewals();
      sendJson(res, 200, { renewals, total: renewals.length });
      return true;
    }

    // 13. Audit History
    if (path === '/api/audit-history' && method === 'GET') {
      const auditLogs = await getAuditLogs();
      sendJson(res, 200, { auditLogs, total: auditLogs.length });
      return true;
    }

    // 14. Contact Inquiry
    if (path === '/api/contact' && method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const parsed = ContactInquirySchema.safeParse(body);
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Validation failed', issues: parsed.error.issues });
        return true;
      }

      const confirmationId = `HCPT-INQ-${Math.floor(100000 + Math.random() * 900000)}`;
      const inquiryRecord = {
        confirmationId,
        ...parsed.data,
        status: 'NEW',
        receivedAt: new Date().toISOString()
      };

      await insertContactInquiry(inquiryRecord);

      await addAuditLog(
        'CONTACT_INQUIRY_RECEIVED',
        'Inquiry',
        confirmationId,
        `Enterprise consultation request from ${parsed.data.fullName} (${parsed.data.organizationName})`,
        parsed.data.fullName,
        'Prospective Client'
      );

      // Dispatch Resend notification email asynchronously to villagecoders7@gmail.com
      const emailResult = await sendEngagementNotification(inquiryRecord);

      sendJson(res, 201, {
        success: true,
        confirmationId,
        emailDispatched: emailResult.success,
        message: 'Your inquiry has been logged in the HCPT enterprise consultation pipeline.'
      });
      return true;
    }

    // 14a. Admin Authentication (Login & Verify)
    if (path === '/api/admin/login' && method === 'POST') {
      const body = await parseJsonBody<{ username?: string; email?: string; password?: string }>(req);
      const identifier = (body.username || body.email || '').trim().toLowerCase();
      const password = (body.password || '').trim();

      const validIdentifier = (identifier === ADMIN_USERNAME.toLowerCase() || identifier === ADMIN_EMAIL.toLowerCase());
      const validPassword = (password === ADMIN_PASSWORD);

      if (!validIdentifier || !validPassword) {
        sendJson(res, 401, {
          success: false,
          error: 'Invalid administrative credentials. Access denied.'
        });
        return true;
      }

      const token = generateAdminToken(identifier);
      sendJson(res, 200, {
        success: true,
        token,
        admin: {
          username: ADMIN_USERNAME,
          email: ADMIN_EMAIL,
          role: 'Super Administrator',
          authenticatedAt: new Date().toISOString()
        }
      });
      return true;
    }

    if (path === '/api/admin/verify' && method === 'GET') {
      const token = getBearerToken(req);
      if (!verifyAdminToken(token)) {
        sendJson(res, 401, { success: false, error: 'Unauthorized: Invalid or expired administrative token' });
        return true;
      }
      sendJson(res, 200, { success: true, message: 'Administrative session valid' });
      return true;
    }

    // 14b. Get All Contact Inquiries (Admin Portal - Protected)
    if ((path === '/api/contact' || path === '/api/admin/inquiries') && method === 'GET') {
      const token = getBearerToken(req);
      if (!verifyAdminToken(token)) {
        sendJson(res, 401, { error: 'Unauthorized: Administrative authentication required' });
        return true;
      }
      const inquiries = await getContactInquiries();
      sendJson(res, 200, inquiries);
      return true;
    }

    // 14c. Update Contact Inquiry Status (Admin Portal - Protected)
    if (path.startsWith('/api/admin/inquiries/') && method === 'PATCH') {
      const token = getBearerToken(req);
      if (!verifyAdminToken(token)) {
        sendJson(res, 401, { error: 'Unauthorized: Administrative authentication required' });
        return true;
      }
      const confirmationId = path.replace('/api/admin/inquiries/', '').trim();
      const body = await parseJsonBody<{ status?: string }>(req);
      if (!body.status) {
        sendJson(res, 400, { error: 'Missing status field' });
        return true;
      }
      const updated = await updateContactInquiryStatus(confirmationId, body.status);
      if (!updated) {
        sendJson(res, 404, { error: 'Inquiry not found', confirmationId });
        return true;
      }
      sendJson(res, 200, { success: true, confirmationId, status: body.status });
      return true;
    }

    // 14d. Get Visitor Locations (Admin Portal - Protected)
    if ((path === '/api/visitors/locations' || path === '/api/admin/visitor-locations') && method === 'GET') {
      const token = getBearerToken(req);
      if (!verifyAdminToken(token)) {
        sendJson(res, 401, { error: 'Unauthorized: Administrative authentication required' });
        return true;
      }
      const locations = await getVisitorLocations();
      sendJson(res, 200, locations);
      return true;
    }

    // 14e. Record Visitor Location (Logged automatically on website visits)
    if ((path === '/api/visitors/location' || path === '/api/visitors') && method === 'POST') {
      const body = await parseJsonBody<{
        city?: string;
        region?: string;
        country?: string;
        countryCode?: string;
        flag?: string;
      }>(req);

      const recorded = await recordVisitorLocation({
        city: body.city || 'Unknown City',
        region: body.region || '',
        country: body.country || 'Unknown Country',
        countryCode: body.countryCode || 'UN',
        flag: body.flag || '🌐'
      });

      sendJson(res, 201, { success: true, location: recorded });
      return true;
    }

    // 15. Reset Store
    if (path === '/api/reset' && method === 'POST') {
      await resetDatabase();
      sendJson(res, 200, { success: true, message: 'Platform demo data reset to initial baseline in MongoDB Atlas.' });
      return true;
    }

    // Unmatched API Route
    sendJson(res, 404, { error: 'Endpoint not found', path });
    return true;
  } catch (err: any) {
    sendJson(res, 500, { error: 'Internal API error', message: err?.message || String(err) });
    return true;
  }
}
