import type { IncomingMessage, ServerResponse } from 'http';
import {
  StatusUpdateSchema,
  ContactInquirySchema,
  ScheduleInspectionSchema,
  ReviewNoteSchema,
  RequestInfoSchema
} from './validators/schemas';
import {
  INITIAL_APPLICATIONS,
  INITIAL_ORGANIZATIONS,
  INITIAL_INSPECTIONS,
  INITIAL_CERTIFICATES,
  INITIAL_RENEWALS,
  INITIAL_AUDIT_LOGS
} from './data/mockData';
import {
  CertificationApplication,
  Organization,
  InspectionRecord,
  CertificateRecord,
  RenewalRecord,
  AuditHistoryEvent,
  ApplicationStatus,
  PERMITTED_STATUS_TRANSITIONS
} from './types/certification';

// In-memory persistent state for API server
let applications: CertificationApplication[] = JSON.parse(JSON.stringify(INITIAL_APPLICATIONS));
let organizations: Organization[] = JSON.parse(JSON.stringify(INITIAL_ORGANIZATIONS));
let inspections: InspectionRecord[] = JSON.parse(JSON.stringify(INITIAL_INSPECTIONS));
let certificates: CertificateRecord[] = JSON.parse(JSON.stringify(INITIAL_CERTIFICATES));
let renewals: RenewalRecord[] = JSON.parse(JSON.stringify(INITIAL_RENEWALS));
let auditLogs: AuditHistoryEvent[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));

function addAuditLog(
  action: string,
  targetEntity: string,
  targetRef: string,
  details: string,
  actor: string = 'API User (Assessor)',
  role: string = 'System Service'
): void {
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
  auditLogs = [newLog, ...auditLogs];
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
    if (path === '/api/health' && method === 'GET') {
      sendJson(res, 200, {
        status: 'healthy',
        service: 'HCPT Halal Certification Platform API Gateway',
        version: '2.4.0-enterprise',
        environment: 'standalone-backend',
        timestamp: new Date().toISOString()
      });
      return true;
    }

    // 2. Dashboard summary
    if (path === '/api/dashboard' && method === 'GET') {
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
      let result = [...applications];
      const status = query.get('status');
      const category = query.get('category');
      const search = query.get('search');

      if (status && status !== 'ALL') {
        result = result.filter(a => a.status === status);
      }
      if (category && category !== 'ALL') {
        result = result.filter(a => a.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          a =>
            a.referenceNumber.toLowerCase().includes(q) ||
            a.organizationName.toLowerCase().includes(q) ||
            a.facilityName.toLowerCase().includes(q) ||
            a.products.some(p => p.name.toLowerCase().includes(q))
        );
      }

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
      const app = applications.find(a => a.id === id || a.referenceNumber === id);
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

      const appIndex = applications.findIndex(a => a.id === id || a.referenceNumber === id);
      if (appIndex === -1) {
        sendJson(res, 404, { error: 'Application not found' });
        return true;
      }

      const current = applications[appIndex];
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
      current.status = nextStatus;
      current.lastUpdated = new Date().toISOString().substring(0, 10);
      current.timeline.unshift({
        id: `tl-${Date.now()}`,
        status: nextStatus,
        actor,
        role: 'Certification Officer',
        description: parsed.data.reason,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      });

      addAuditLog(
        'STATUS_TRANSITION',
        'Application',
        current.referenceNumber,
        `Transitioned to ${nextStatus}. Reason: ${parsed.data.reason}`,
        actor
      );

      sendJson(res, 200, {
        success: true,
        message: `Application transitioned to ${nextStatus}`,
        application: current
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

      const app = applications.find(a => a.id === id || a.referenceNumber === id);
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
      app.notes.unshift(note);

      addAuditLog(
        'NOTE_RECORDED',
        'Application',
        app.referenceNumber,
        `Reviewer note added: "${note.content.substring(0, 50)}..."`,
        note.author,
        note.role
      );

      sendJson(res, 201, { success: true, note, application: app });
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

      const app = applications.find(a => a.id === id || a.referenceNumber === id);
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
      app.missingInfoRequests.unshift(rfi);

      if (PERMITTED_STATUS_TRANSITIONS[app.status]?.includes('Awaiting Applicant Information')) {
        app.status = 'Awaiting Applicant Information';
        app.timeline.unshift({
          id: `tl-${Date.now()}`,
          status: 'Awaiting Applicant Information',
          actor: parsed.data.requestedBy,
          role: 'Certification Assessor',
          description: `RFI Dispatched: ${parsed.data.message}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
        });
      }

      addAuditLog(
        'RFI_DISPATCHED',
        'Application',
        app.referenceNumber,
        `Information request dispatched: ${parsed.data.message}`,
        parsed.data.requestedBy
      );

      sendJson(res, 201, { success: true, rfi, application: app });
      return true;
    }

    // 8. Organizations
    if (path === '/api/organizations' && method === 'GET') {
      sendJson(res, 200, { organizations, total: organizations.length });
      return true;
    }

    const orgDetailMatch = path.match(/^\/api\/organizations\/([^/]+)$/);
    if (orgDetailMatch && method === 'GET') {
      const id = orgDetailMatch[1];
      const org = organizations.find(o => o.id === id);
      if (!org) {
        sendJson(res, 404, { error: 'Organization not found' });
        return true;
      }
      sendJson(res, 200, { organization: org });
      return true;
    }

    // 9. Inspections
    if (path === '/api/inspections' && method === 'GET') {
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

      const app = applications.find(a => a.id === parsed.data.applicationId);
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

      inspections = [newInsp, ...inspections];
      app.inspectionId = newInsp.id;
      app.assignedInspector = newInsp.assignedInspector;

      if (PERMITTED_STATUS_TRANSITIONS[app.status]?.includes('Inspection Scheduled')) {
        app.status = 'Inspection Scheduled';
        app.timeline.unshift({
          id: `tl-${Date.now()}`,
          status: 'Inspection Scheduled',
          actor: 'Operations Dispatch',
          role: 'Logistics Coordinator',
          description: `On-site inspection scheduled for ${newInsp.scheduledDate} with ${newInsp.assignedInspector}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
        });
      }

      addAuditLog(
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
      const insp = inspections.find(i => i.id === id);
      if (!insp) {
        sendJson(res, 404, { error: 'Inspection not found' });
        return true;
      }

      insp.status = 'Completed';
      insp.outcome = body.outcome || 'Compliant / Recommended';
      insp.findingsSummary = body.findingsSummary || 'All audit criteria verified compliant.';
      insp.checklist.forEach(c => (c.verified = true));

      const app = applications.find(a => a.id === insp.applicationId);
      if (app && PERMITTED_STATUS_TRANSITIONS[app.status]?.includes('Inspection Completed')) {
        app.status = 'Inspection Completed';
        app.timeline.unshift({
          id: `tl-${Date.now()}`,
          status: 'Inspection Completed',
          actor: insp.assignedInspector,
          role: 'Lead Auditor',
          description: `Field audit completed: ${insp.outcome}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
        });
      }

      addAuditLog(
        'INSPECTION_COMPLETED',
        'Inspection',
        insp.inspectionRef,
        `Audit completed with outcome: ${insp.outcome}`,
        insp.assignedInspector
      );

      sendJson(res, 200, { success: true, inspection: insp });
      return true;
    }

    // 11. Certificates
    if (path === '/api/certificates' && method === 'GET') {
      sendJson(res, 200, { certificates, total: certificates.length });
      return true;
    }

    if (path === '/api/certificates/issue' && method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const app = applications.find(a => a.id === body.applicationId);
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

      certificates = [newCert, ...certificates];
      app.status = 'Certificate Issued';
      app.certificateId = newCert.id;
      app.timeline.unshift({
        id: `tl-${Date.now()}`,
        status: 'Certificate Issued',
        actor: 'Certification Directorate',
        role: 'Director General',
        description: `Certificate ${certNum} generated and cryptographically sealed.`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      });

      addAuditLog(
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
      sendJson(res, 200, { renewals, total: renewals.length });
      return true;
    }

    // 13. Audit History
    if (path === '/api/audit-history' && method === 'GET') {
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
      addAuditLog(
        'CONTACT_INQUIRY_RECEIVED',
        'Inquiry',
        confirmationId,
        `Enterprise consultation request from ${parsed.data.fullName} (${parsed.data.organizationName})`,
        parsed.data.fullName,
        'Prospective Client'
      );

      sendJson(res, 201, {
        success: true,
        confirmationId,
        message: 'Your inquiry has been logged in the HCPT enterprise consultation pipeline.'
      });
      return true;
    }

    // 15. Reset Store
    if (path === '/api/reset' && method === 'POST') {
      applications = JSON.parse(JSON.stringify(INITIAL_APPLICATIONS));
      organizations = JSON.parse(JSON.stringify(INITIAL_ORGANIZATIONS));
      inspections = JSON.parse(JSON.stringify(INITIAL_INSPECTIONS));
      certificates = JSON.parse(JSON.stringify(INITIAL_CERTIFICATES));
      renewals = JSON.parse(JSON.stringify(INITIAL_RENEWALS));
      auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));

      sendJson(res, 200, { success: true, message: 'Platform demo data reset to initial baseline.' });
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
