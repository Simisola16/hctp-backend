import { MongoClient, Db, Collection } from 'mongodb';
import 'dotenv/config';
import {
  CertificationApplication,
  Organization,
  InspectionRecord,
  CertificateRecord,
  RenewalRecord,
  AuditHistoryEvent
} from './types/certification';
import {
  INITIAL_APPLICATIONS,
  INITIAL_ORGANIZATIONS,
  INITIAL_INSPECTIONS,
  INITIAL_CERTIFICATES,
  INITIAL_RENEWALS,
  INITIAL_AUDIT_LOGS
} from './data/mockData';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcpt_certification';
const DB_NAME = 'hcpt_certification';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

// Fallback in-memory state if MongoDB is temporarily offline
let fallbackApplications: CertificationApplication[] = JSON.parse(JSON.stringify(INITIAL_APPLICATIONS));
let fallbackOrganizations: Organization[] = JSON.parse(JSON.stringify(INITIAL_ORGANIZATIONS));
let fallbackInspections: InspectionRecord[] = JSON.parse(JSON.stringify(INITIAL_INSPECTIONS));
let fallbackCertificates: CertificateRecord[] = JSON.parse(JSON.stringify(INITIAL_CERTIFICATES));
let fallbackRenewals: RenewalRecord[] = JSON.parse(JSON.stringify(INITIAL_RENEWALS));
let fallbackAuditLogs: AuditHistoryEvent[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));

const INITIAL_INQUIRIES: any[] = [
  {
    confirmationId: 'HCPT-INQ-849102',
    fullName: 'Dr. Tariq Al-Hashimi',
    organizationName: 'Gulf Halal Standards Authority',
    officialEmail: 'tariq.hashimi@ghsa.gov.ae',
    phoneNumber: '+971 4 398 2210',
    jurisdiction: 'United Arab Emirates / GCC',
    currentSystem: 'Legacy bespoke database with manual PDF handling',
    annualCertificates: '5,000 - 25,000 certificates/year',
    inquiryDetails: 'Seeking sovereign cloud deployment to transition our national halal assessment network from paper-based audit checklists to cryptographically verifiable QR digital credentials with GSO 2055-1 compliance.',
    status: 'NEW',
    receivedAt: '2026-10-21 14:15:00 UTC'
  },
  {
    confirmationId: 'HCPT-INQ-631249',
    fullName: 'Hajjah Noor Aminah binti Razak',
    organizationName: 'ASEAN Halal Assurance Consortium',
    officialEmail: 'n.aminah@asean-halal.org',
    phoneNumber: '+60 3 8886 4500',
    jurisdiction: 'Malaysia / ASEAN (JAKIM)',
    currentSystem: 'Multi-system hybrid with manual spreadsheet reconciliation',
    annualCertificates: '25,000+ certificates/year',
    inquiryDetails: 'Evaluating technical review workflow engine for multinational food manufacturing audits across 14 export corridors. Need automated ingredient biochemical cross-matching and laboratory test result ingest.',
    status: 'IN_REVIEW',
    receivedAt: '2026-10-20 09:30:00 UTC'
  },
  {
    confirmationId: 'HCPT-INQ-492715',
    fullName: 'Marc Van Der Berg',
    organizationName: 'European Halal Certification Council (EHCC)',
    officialEmail: 'm.vanderberg@ehcc-eu.com',
    phoneNumber: '+31 20 894 3320',
    jurisdiction: 'European Union / UK',
    currentSystem: 'Custom internal ERP without digital certificate verification',
    annualCertificates: '1,000 - 5,000 certificates/year',
    inquiryDetails: 'Urgent requirement to modernize slaughterhouse audit reporting and issue tamper-proof digital certificates recognized by GCC and BPJPH authorities for EU meat exporters.',
    status: 'CONTACTED',
    receivedAt: '2026-10-19 16:45:00 UTC'
  }
];

let fallbackInquiries: any[] = JSON.parse(JSON.stringify(INITIAL_INQUIRIES));

export async function initDb(): Promise<void> {
  if (isConnected && db) return;

  try {
    console.log('[MongoDB] Connecting to MongoDB Atlas cluster...');
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to database: ${DB_NAME}`);

    // Auto-seed if empty
    const appCount = await db.collection('applications').countDocuments();
    if (appCount === 0) {
      console.log('[MongoDB] Empty database detected. Seeding initial baseline data...');
      await seedBaselineData();
      console.log('[MongoDB] Seeding completed successfully.');
    } else {
      console.log(`[MongoDB] Found ${appCount} existing application records in Atlas.`);
    }

    // Ensure helpful indexes
    await db.collection('applications').createIndex({ id: 1 }, { unique: true });
    await db.collection('applications').createIndex({ referenceNumber: 1 });
    await db.collection('organizations').createIndex({ id: 1 }, { unique: true });
    await db.collection('inspections').createIndex({ id: 1 }, { unique: true });
    await db.collection('certificates').createIndex({ id: 1 }, { unique: true });
    await db.collection('certificates').createIndex({ certificateNumber: 1 });
  } catch (err: any) {
    console.error('[MongoDB] Connection error, operating in resilient memory-fallback mode:', err.message);
    isConnected = false;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}

export function getDatabaseName(): string {
  return DB_NAME;
}

export async function seedBaselineData(): Promise<void> {
  if (!db) return;

  await db.collection('applications').deleteMany({});
  await db.collection('organizations').deleteMany({});
  await db.collection('inspections').deleteMany({});
  await db.collection('certificates').deleteMany({});
  await db.collection('renewals').deleteMany({});
  await db.collection('audit_logs').deleteMany({});

  if (INITIAL_APPLICATIONS.length > 0) {
    await db.collection('applications').insertMany(JSON.parse(JSON.stringify(INITIAL_APPLICATIONS)));
  }
  if (INITIAL_ORGANIZATIONS.length > 0) {
    await db.collection('organizations').insertMany(JSON.parse(JSON.stringify(INITIAL_ORGANIZATIONS)));
  }
  if (INITIAL_INSPECTIONS.length > 0) {
    await db.collection('inspections').insertMany(JSON.parse(JSON.stringify(INITIAL_INSPECTIONS)));
  }
  if (INITIAL_CERTIFICATES.length > 0) {
    await db.collection('certificates').insertMany(JSON.parse(JSON.stringify(INITIAL_CERTIFICATES)));
  }
  if (INITIAL_RENEWALS.length > 0) {
    await db.collection('renewals').insertMany(JSON.parse(JSON.stringify(INITIAL_RENEWALS)));
  }
  if (INITIAL_AUDIT_LOGS.length > 0) {
    await db.collection('audit_logs').insertMany(JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)));
  }
}

// ----------------- Data Accessors -----------------

export async function getApplications(filter?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<CertificationApplication[]> {
  if (db && isConnected) {
    const query: any = {};
    if (filter?.status && filter.status !== 'ALL') {
      query.status = filter.status;
    }
    if (filter?.category && filter.category !== 'ALL') {
      query.category = filter.category;
    }
    if (filter?.search) {
      const q = filter.search;
      query.$or = [
        { referenceNumber: { $regex: q, $options: 'i' } },
        { organizationName: { $regex: q, $options: 'i' } },
        { facilityName: { $regex: q, $options: 'i' } },
        { 'products.name': { $regex: q, $options: 'i' } }
      ];
    }
    const docs = await db.collection<CertificationApplication>('applications')
      .find(query, { projection: { _id: 0 } })
      .toArray();
    return docs;
  }

  // Fallback
  let result = [...fallbackApplications];
  if (filter?.status && filter.status !== 'ALL') {
    result = result.filter(a => a.status === filter.status);
  }
  if (filter?.category && filter.category !== 'ALL') {
    result = result.filter(a => a.category === filter.category);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      a =>
        a.referenceNumber.toLowerCase().includes(q) ||
        a.organizationName.toLowerCase().includes(q) ||
        a.facilityName.toLowerCase().includes(q) ||
        a.products.some(p => p.name.toLowerCase().includes(q))
    );
  }
  return result;
}

export async function getApplicationByIdOrRef(idOrRef: string): Promise<CertificationApplication | null> {
  if (db && isConnected) {
    const doc = await db.collection<CertificationApplication>('applications').findOne(
      { $or: [{ id: idOrRef }, { referenceNumber: idOrRef }] },
      { projection: { _id: 0 } }
    );
    return doc || null;
  }
  return fallbackApplications.find(a => a.id === idOrRef || a.referenceNumber === idOrRef) || null;
}

export async function updateApplication(
  idOrRef: string,
  updates: Partial<CertificationApplication>
): Promise<CertificationApplication | null> {
  if (db && isConnected) {
    await db.collection<CertificationApplication>('applications').updateOne(
      { $or: [{ id: idOrRef }, { referenceNumber: idOrRef }] },
      { $set: updates }
    );
    return getApplicationByIdOrRef(idOrRef);
  }

  const idx = fallbackApplications.findIndex(a => a.id === idOrRef || a.referenceNumber === idOrRef);
  if (idx !== -1) {
    fallbackApplications[idx] = { ...fallbackApplications[idx], ...updates };
    return fallbackApplications[idx];
  }
  return null;
}

export async function getOrganizations(): Promise<Organization[]> {
  if (db && isConnected) {
    return await db.collection<Organization>('organizations')
      .find({}, { projection: { _id: 0 } })
      .toArray();
  }
  return fallbackOrganizations;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  if (db && isConnected) {
    return await db.collection<Organization>('organizations').findOne(
      { id },
      { projection: { _id: 0 } }
    );
  }
  return fallbackOrganizations.find(o => o.id === id) || null;
}

export async function getInspections(): Promise<InspectionRecord[]> {
  if (db && isConnected) {
    return await db.collection<InspectionRecord>('inspections')
      .find({}, { projection: { _id: 0 } })
      .toArray();
  }
  return fallbackInspections;
}

export async function getInspectionById(id: string): Promise<InspectionRecord | null> {
  if (db && isConnected) {
    return await db.collection<InspectionRecord>('inspections').findOne(
      { id },
      { projection: { _id: 0 } }
    );
  }
  return fallbackInspections.find(i => i.id === id) || null;
}

export async function insertInspection(insp: InspectionRecord): Promise<void> {
  if (db && isConnected) {
    await db.collection('inspections').insertOne({ ...insp });
  }
  fallbackInspections = [insp, ...fallbackInspections];
}

export async function updateInspection(
  id: string,
  updates: Partial<InspectionRecord>
): Promise<InspectionRecord | null> {
  if (db && isConnected) {
    await db.collection('inspections').updateOne({ id }, { $set: updates });
    return getInspectionById(id);
  }
  const idx = fallbackInspections.findIndex(i => i.id === id);
  if (idx !== -1) {
    fallbackInspections[idx] = { ...fallbackInspections[idx], ...updates };
    return fallbackInspections[idx];
  }
  return null;
}

export async function getCertificates(): Promise<CertificateRecord[]> {
  if (db && isConnected) {
    return await db.collection<CertificateRecord>('certificates')
      .find({}, { projection: { _id: 0 } })
      .toArray();
  }
  return fallbackCertificates;
}

export async function insertCertificate(cert: CertificateRecord): Promise<void> {
  if (db && isConnected) {
    await db.collection('certificates').insertOne({ ...cert });
  }
  fallbackCertificates = [cert, ...fallbackCertificates];
}

export async function getRenewals(): Promise<RenewalRecord[]> {
  if (db && isConnected) {
    return await db.collection<RenewalRecord>('renewals')
      .find({}, { projection: { _id: 0 } })
      .toArray();
  }
  return fallbackRenewals;
}

export async function getAuditLogs(): Promise<AuditHistoryEvent[]> {
  if (db && isConnected) {
    return await db.collection<AuditHistoryEvent>('audit_logs')
      .find({}, { projection: { _id: 0 } })
      .sort({ timestamp: -1 })
      .toArray();
  }
  return fallbackAuditLogs;
}

export async function insertAuditLog(log: AuditHistoryEvent): Promise<void> {
  if (db && isConnected) {
    await db.collection('audit_logs').insertOne({ ...log });
  }
  fallbackAuditLogs = [log, ...fallbackAuditLogs];
}

export async function getContactInquiries(): Promise<any[]> {
  if (db && isConnected) {
    const list = await db.collection('contact_inquiries')
      .find({}, { projection: { _id: 0 } })
      .sort({ receivedAt: -1 })
      .toArray();
    if (list && list.length > 0) return list;
  }
  return fallbackInquiries;
}

export async function insertContactInquiry(inquiry: any): Promise<void> {
  const record = {
    ...inquiry,
    status: inquiry.status || 'NEW',
    receivedAt: inquiry.receivedAt || new Date().toISOString()
  };
  if (db && isConnected) {
    await db.collection('contact_inquiries').insertOne(record);
  }
  fallbackInquiries = [record, ...fallbackInquiries];
}

export async function updateContactInquiryStatus(confirmationId: string, status: string): Promise<boolean> {
  if (db && isConnected) {
    await db.collection('contact_inquiries').updateOne(
      { confirmationId },
      { $set: { status, updatedAt: new Date().toISOString() } }
    );
  }
  const item = fallbackInquiries.find(i => i.confirmationId === confirmationId);
  if (item) {
    item.status = status;
    item.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}

export async function resetDatabase(): Promise<void> {
  if (db && isConnected) {
    await seedBaselineData();
  }
  fallbackApplications = JSON.parse(JSON.stringify(INITIAL_APPLICATIONS));
  fallbackOrganizations = JSON.parse(JSON.stringify(INITIAL_ORGANIZATIONS));
  fallbackInspections = JSON.parse(JSON.stringify(INITIAL_INSPECTIONS));
  fallbackCertificates = JSON.parse(JSON.stringify(INITIAL_CERTIFICATES));
  fallbackRenewals = JSON.parse(JSON.stringify(INITIAL_RENEWALS));
  fallbackAuditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
  fallbackInquiries = JSON.parse(JSON.stringify(INITIAL_INQUIRIES));
}
