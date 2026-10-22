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
  SupportConversation,
  SupportMessage,
  InternalStaffNote,
  SupportStatsSummary
} from './types/support';
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

export interface VisitorLocationRecord {
  id: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  flag: string;
  timestamp: string;
}

const INITIAL_VISITOR_LOCATIONS: VisitorLocationRecord[] = [
  {
    id: 'loc-101',
    city: 'Dubai',
    region: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    flag: '🇦🇪',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString()
  },
  {
    id: 'loc-102',
    city: 'Kuala Lumpur',
    region: 'Federal Territory',
    country: 'Malaysia',
    countryCode: 'MY',
    flag: '🇲🇾',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString()
  },
  {
    id: 'loc-103',
    city: 'Riyadh',
    region: 'Riyadh Province',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    flag: '🇸🇦',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: 'loc-104',
    city: 'Abu Dhabi',
    region: 'Abu Dhabi',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    flag: '🇦🇪',
    timestamp: new Date(Date.now() - 52 * 60 * 1000).toISOString()
  },
  {
    id: 'loc-105',
    city: 'London',
    region: 'Greater London',
    country: 'United Kingdom',
    countryCode: 'GB',
    flag: '🇬🇧',
    timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString()
  },
  {
    id: 'loc-106',
    city: 'Jakarta',
    region: 'DKI Jakarta',
    country: 'Indonesia',
    countryCode: 'ID',
    flag: '🇮🇩',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString()
  },
  {
    id: 'loc-107',
    city: 'Istanbul',
    region: 'Marmara',
    country: 'Turkey',
    countryCode: 'TR',
    flag: '🇹🇷',
    timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString()
  },
  {
    id: 'loc-108',
    city: 'Singapore',
    region: 'Central Region',
    country: 'Singapore',
    countryCode: 'SG',
    flag: '🇸🇬',
    timestamp: new Date(Date.now() - 210 * 60 * 1000).toISOString()
  },
  {
    id: 'loc-109',
    city: 'Chicago',
    region: 'Illinois',
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    timestamp: new Date(Date.now() - 290 * 60 * 1000).toISOString()
  },
  {
    id: 'loc-110',
    city: 'Doha',
    region: 'Ad Dawhah',
    country: 'Qatar',
    countryCode: 'QA',
    flag: '🇶🇦',
    timestamp: new Date(Date.now() - 380 * 60 * 1000).toISOString()
  }
];

let fallbackVisitorLocations: VisitorLocationRecord[] = JSON.parse(JSON.stringify(INITIAL_VISITOR_LOCATIONS));

export async function getVisitorLocations(): Promise<VisitorLocationRecord[]> {
  if (db && isConnected) {
    try {
      const list = await db.collection('visitor_locations')
        .find({}, { projection: { _id: 0 } })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();
      if (list && list.length > 0) return list as any[];
    } catch (e) {
      console.warn('Error fetching visitor_locations from Mongo, using fallback:', e);
    }
  }
  return fallbackVisitorLocations;
}

export async function recordVisitorLocation(loc: Omit<VisitorLocationRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<VisitorLocationRecord> {
  const newRecord: VisitorLocationRecord = {
    id: loc.id || `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    city: loc.city || 'Unknown City',
    region: loc.region || '',
    country: loc.country || 'Unknown Country',
    countryCode: (loc.countryCode || 'UN').toUpperCase(),
    flag: loc.flag || '🌐',
    timestamp: loc.timestamp || new Date().toISOString()
  };

  if (db && isConnected) {
    try {
      await db.collection('visitor_locations').insertOne(newRecord);
    } catch (e) {
      console.warn('Error inserting visitor location to Mongo:', e);
    }
  }

  fallbackVisitorLocations = [newRecord, ...fallbackVisitorLocations].slice(0, 100);
  return newRecord;
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
  fallbackVisitorLocations = JSON.parse(JSON.stringify(INITIAL_VISITOR_LOCATIONS));
  fallbackSupportConversations = JSON.parse(JSON.stringify(INITIAL_SUPPORT_CONVERSATIONS));
}

// =========================================================================
// Support Conversations & Real-time Inbox Telemetry
// =========================================================================

const INITIAL_SUPPORT_CONVERSATIONS: SupportConversation[] = [
  {
    id: 'conv-hcpt-8821',
    sessionToken: 'token-session-guest-8821-secure',
    customer: {
      name: 'Zayd Ibrahim',
      email: 'z.ibrahim@emiratesfood.ae',
      phone: '+971 4 883 9100',
      organization: 'Emirates Food Group (UAE)',
      isGuest: false,
      visitorLocation: {
        city: 'Dubai',
        country: 'United Arab Emirates',
        countryCode: 'AE',
        flag: '🇦🇪'
      }
    },
    status: 'awaiting_human',
    handlingMode: 'human',
    priority: 'urgent',
    escalationReason: 'Visitor requested technical briefing on abattoir batch RFID tracking integration',
    escalatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    unreadByAdmin: true,
    unreadByCustomer: false,
    messages: [
      {
        id: 'msg-8821-1',
        conversationId: 'conv-hcpt-8821',
        sender: 'customer',
        authorName: 'Zayd Ibrahim',
        text: 'Hello, we are evaluating the platform demo for our slaughterhouse network. Can HCPT integrate with RFID livestock ear-tag scanners for pre-slaughter vetting?',
        createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-8821-2',
        conversationId: 'conv-hcpt-8821',
        sender: 'ai',
        authorName: 'HCPT AI Assistant',
        text: 'Welcome to HCPT! Yes, our Electronic Application Processing and Workflow Management modules support automated ingestion of pre-slaughter livestock batches (including RFID tag telemetry and veterinary clearance certificates) aligned with GSO 993 standards.',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-8821-3',
        conversationId: 'conv-hcpt-8821',
        sender: 'customer',
        authorName: 'Zayd Ibrahim',
        text: 'Can I speak with a technical human representative regarding high-throughput API latency and on-premise edge deployments?',
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-8821-4',
        conversationId: 'conv-hcpt-8821',
        sender: 'ai',
        authorName: 'HCPT AI Assistant',
        text: "I'll pass this conversation to the HCPT support team. You can continue sending messages here, and a team member will respond as soon as they are available.",
        createdAt: new Date(Date.now() - 24 * 60 * 1000).toISOString()
      }
    ],
    internalNotes: [
      {
        id: 'note-8821-1',
        author: 'System Escalate',
        text: 'Customer requested human assistance. Priority marked urgent due to sovereign abattoir evaluation.',
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 1000).toISOString()
  },
  {
    id: 'conv-hcpt-9142',
    sessionToken: 'token-session-guest-9142-secure',
    customer: {
      name: 'Amina El-Sayed',
      email: 'amina@cairologistics.eg',
      organization: 'Cairo Food Logistics',
      isGuest: false,
      visitorLocation: {
        city: 'Cairo',
        country: 'Egypt',
        countryCode: 'EG',
        flag: '🇪🇬'
      }
    },
    status: 'human_handling',
    handlingMode: 'human',
    priority: 'normal',
    assignedAgent: 'admin',
    unreadByAdmin: false,
    unreadByCustomer: false,
    messages: [
      {
        id: 'msg-9142-1',
        conversationId: 'conv-hcpt-9142',
        sender: 'customer',
        authorName: 'Amina El-Sayed',
        text: 'Hi, we checked certificate CERT-2026-8812 on the public verification page earlier today. Is the QR code scan cryptographically verified against the Central Registry?',
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-9142-2',
        conversationId: 'conv-hcpt-9142',
        sender: 'human',
        authorName: 'Admin',
        text: 'Hello Amina! Yes, every QR code on an HCPT certificate embeds a digital cryptographic digest signed with ECDSA-P384. When scanned, it performs an immutable signature validation against our Central Registry.',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-9142-3',
        conversationId: 'conv-hcpt-9142',
        sender: 'customer',
        authorName: 'Amina El-Sayed',
        text: 'Excellent, that satisfies our port authority requirement for customs export to GCC countries.',
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
      }
    ],
    internalNotes: [],
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
  },
  {
    id: 'conv-hcpt-7031',
    sessionToken: 'token-session-guest-7031-secure',
    customer: {
      name: 'Website Visitor',
      isGuest: true,
      visitorLocation: {
        city: 'London',
        country: 'United Kingdom',
        countryCode: 'GB',
        flag: '🇬🇧'
      }
    },
    status: 'open',
    handlingMode: 'ai',
    priority: 'normal',
    unreadByAdmin: false,
    unreadByCustomer: false,
    messages: [
      {
        id: 'msg-7031-1',
        conversationId: 'conv-hcpt-7031',
        sender: 'customer',
        authorName: 'Guest',
        text: 'What are the main stages of the certification workflow in HCPT?',
        createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-7031-2',
        conversationId: 'conv-hcpt-7031',
        sender: 'ai',
        authorName: 'HCPT AI Assistant',
        text: 'The HCPT platform orchestrates a 6-stage lifecycle: 1. Electronic Intake & Triage, 2. Technical Assessor Review, 3. On-Site Inspection Scheduling & Audit, 4. Shariah Supervisory Board Ruling, 5. Directorate Sign-off, and 6. Cryptographic Certificate Issuance with QR Registry Verification.',
        createdAt: new Date(Date.now() - 49 * 60 * 1000).toISOString()
      }
    ],
    internalNotes: [],
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 49 * 60 * 1000).toISOString()
  }
];

let fallbackSupportConversations: SupportConversation[] = JSON.parse(JSON.stringify(INITIAL_SUPPORT_CONVERSATIONS));

export async function getSupportConversations(filter?: {
  status?: string;
  search?: string;
  unreadOnly?: boolean;
}): Promise<SupportConversation[]> {
  if (db && isConnected) {
    try {
      const query: any = {};
      if (filter?.status && filter.status !== 'all') {
        query.status = filter.status;
      }
      if (filter?.unreadOnly) {
        query.unreadByAdmin = true;
      }
      if (filter?.search) {
        const regex = new RegExp(filter.search, 'i');
        query.$or = [
          { 'customer.name': regex },
          { 'customer.email': regex },
          { 'customer.organization': regex },
          { id: regex },
          { 'messages.text': regex }
        ];
      }

      const list = await db.collection('support_conversations')
        .find(query, { projection: { _id: 0 } })
        .sort({ updatedAt: -1 })
        .limit(200)
        .toArray();

      return list as unknown as SupportConversation[];
    } catch (e) {
      console.warn('Error fetching support_conversations from Mongo, using fallback:', e);
    }
  }

  let result = [...fallbackSupportConversations];
  if (filter?.status && filter.status !== 'all') {
    result = result.filter(c => c.status === filter.status);
  }
  if (filter?.unreadOnly) {
    result = result.filter(c => c.unreadByAdmin);
  }
  if (filter?.search) {
    const s = filter.search.toLowerCase();
    result = result.filter(c =>
      (c.customer.name && c.customer.name.toLowerCase().includes(s)) ||
      (c.customer.email && c.customer.email.toLowerCase().includes(s)) ||
      (c.customer.organization && c.customer.organization.toLowerCase().includes(s)) ||
      c.id.toLowerCase().includes(s) ||
      c.messages.some(m => m.text.toLowerCase().includes(s))
    );
  }

  return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getSupportConversationById(id: string): Promise<SupportConversation | null> {
  if (db && isConnected) {
    try {
      const conv = await db.collection('support_conversations').findOne({ id }, { projection: { _id: 0 } });
      if (conv) return conv as unknown as SupportConversation;
    } catch (e) {
      console.warn('Error fetching conversation from Mongo:', e);
    }
  }
  return fallbackSupportConversations.find(c => c.id === id) || null;
}

export async function getSupportConversationByToken(id: string, sessionToken: string): Promise<SupportConversation | null> {
  const conv = await getSupportConversationById(id);
  if (!conv) return null;
  if (conv.sessionToken && conv.sessionToken !== sessionToken) {
    return null; // Deny unauthorized token access
  }
  return conv;
}

export async function createSupportConversation(conv: SupportConversation): Promise<SupportConversation> {
  if (db && isConnected) {
    try {
      await db.collection('support_conversations').insertOne(conv as any);
    } catch (e) {
      console.warn('Error creating conversation in Mongo:', e);
    }
  }
  fallbackSupportConversations = [conv, ...fallbackSupportConversations];
  return conv;
}

export async function updateSupportConversation(
  id: string,
  updates: Partial<SupportConversation>
): Promise<SupportConversation | null> {
  const now = new Date().toISOString();
  const updatePayload = { ...updates, updatedAt: now };

  if (db && isConnected) {
    try {
      await db.collection('support_conversations').updateOne(
        { id },
        { $set: updatePayload }
      );
    } catch (e) {
      console.warn('Error updating conversation in Mongo:', e);
    }
  }

  const idx = fallbackSupportConversations.findIndex(c => c.id === id);
  if (idx !== -1) {
    fallbackSupportConversations[idx] = {
      ...fallbackSupportConversations[idx],
      ...updatePayload
    };
    return fallbackSupportConversations[idx];
  }
  return null;
}

export async function addSupportMessage(conversationId: string, message: SupportMessage): Promise<SupportMessage> {
  const now = new Date().toISOString();
  if (db && isConnected) {
    try {
      await db.collection('support_conversations').updateOne(
        { id: conversationId },
        {
          $push: { messages: message } as any,
          $set: { updatedAt: now }
        }
      );
    } catch (e) {
      console.warn('Error appending message in Mongo:', e);
    }
  }

  const idx = fallbackSupportConversations.findIndex(c => c.id === conversationId);
  if (idx !== -1) {
    fallbackSupportConversations[idx].messages.push(message);
    fallbackSupportConversations[idx].updatedAt = now;
  }
  return message;
}

export async function addInternalStaffNote(conversationId: string, note: InternalStaffNote): Promise<InternalStaffNote> {
  const now = new Date().toISOString();
  if (db && isConnected) {
    try {
      await db.collection('support_conversations').updateOne(
        { id: conversationId },
        {
          $push: { internalNotes: note } as any,
          $set: { updatedAt: now }
        }
      );
    } catch (e) {
      console.warn('Error adding internal note in Mongo:', e);
    }
  }

  const idx = fallbackSupportConversations.findIndex(c => c.id === conversationId);
  if (idx !== -1) {
    if (!fallbackSupportConversations[idx].internalNotes) {
      fallbackSupportConversations[idx].internalNotes = [];
    }
    fallbackSupportConversations[idx].internalNotes.push(note);
    fallbackSupportConversations[idx].updatedAt = now;
  }
  return note;
}

export async function getSupportStats(): Promise<SupportStatsSummary> {
  const list = await getSupportConversations();
  return {
    total: list.length,
    awaitingHuman: list.filter(c => c.status === 'awaiting_human').length,
    activeHuman: list.filter(c => c.status === 'human_handling').length,
    aiHandled: list.filter(c => c.handlingMode === 'ai' && c.status !== 'resolved').length,
    resolved: list.filter(c => c.status === 'resolved').length,
    unreadCount: list.filter(c => c.unreadByAdmin).length
  };
}

