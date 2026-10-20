export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Initial Review'
  | 'Awaiting Applicant Information'
  | 'Technical Review'
  | 'Inspection Scheduled'
  | 'Inspection Completed'
  | 'Decision Pending'
  | 'Approved'
  | 'Rejected'
  | 'Certificate Issued'
  | 'Renewal Due'
  | 'Closed';

export interface PermittedTransitions {
  [key: string]: ApplicationStatus[];
}

export const PERMITTED_STATUS_TRANSITIONS: PermittedTransitions = {
  'Draft': ['Submitted', 'Closed'],
  'Submitted': ['Initial Review', 'Closed'],
  'Initial Review': ['Awaiting Applicant Information', 'Technical Review', 'Rejected', 'Closed'],
  'Awaiting Applicant Information': ['Initial Review', 'Technical Review', 'Closed'],
  'Technical Review': ['Awaiting Applicant Information', 'Inspection Scheduled', 'Decision Pending', 'Rejected'],
  'Inspection Scheduled': ['Inspection Completed', 'Technical Review'],
  'Inspection Completed': ['Decision Pending', 'Technical Review', 'Awaiting Applicant Information'],
  'Decision Pending': ['Approved', 'Rejected', 'Technical Review'],
  'Approved': ['Certificate Issued', 'Closed'],
  'Rejected': ['Closed'],
  'Certificate Issued': ['Renewal Due', 'Closed'],
  'Renewal Due': ['Submitted', 'Closed'],
  'Closed': ['Draft']
};

export interface ReviewerNote {
  id: string;
  author: string;
  role: string;
  content: string;
  timestamp: string;
  isInternal: boolean;
}

export interface MissingInfoRequest {
  id: string;
  requestedFields: string[];
  message: string;
  requestedBy: string;
  requestedAt: string;
  status: 'Pending Response' | 'Resolved';
  responseDate?: string;
}

export interface ApplicationTimelineEvent {
  id: string;
  status: ApplicationStatus;
  actor: string;
  role: string;
  description: string;
  timestamp: string;
  notes?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  brand: string;
  ingredientsCount: number;
  originCountry: string;
}

export interface ApplicationDocument {
  id: string;
  name: string;
  category:
    | 'Ingredient Traceability'
    | 'Lab Analysis Report'
    | 'Process Flowchart'
    | 'HACCP & Quality Manual'
    | 'Halal Assurance System (HAS)'
    | 'Facility Floorplan'
    | 'Commercial Registration';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  version: string;
  status: 'Approved' | 'Under Review' | 'Needs Revision' | 'Rejected' | 'Pending';
  reviewNotes?: string;
  simulatedUrl?: string;
}

export interface CertificationApplication {
  id: string;
  referenceNumber: string;
  organizationId: string;
  organizationName: string;
  facilityName: string;
  facilityAddress: string;
  country: string;
  applicationType: 'New Certification' | 'Recertification / Renewal' | 'Scope Extension' | 'Facility Relocation';
  category: 'Food & Beverage' | 'Ingredients & Additives' | 'Pharmaceuticals' | 'Cosmetics & Personal Care' | 'Slaughterhouse & Meat' | 'Logistics & Warehousing';
  standardsCompliance: string[];
  status: ApplicationStatus;
  submissionDate: string;
  lastUpdated: string;
  leadReviewer?: string;
  technicalAssessor?: string;
  assignedInspector?: string;
  products: ProductItem[];
  documents: ApplicationDocument[];
  timeline: ApplicationTimelineEvent[];
  notes: ReviewerNote[];
  missingInfoRequests: MissingInfoRequest[];
  inspectionId?: string;
  certificateId?: string;
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  facilityType: string;
  totalProductionLines: number;
  lastAuditDate?: string;
}

export interface OrganizationContact {
  fullName: string;
  title: string;
  email: string;
  phone: string;
}

export interface Organization {
  id: string;
  name: string;
  legalEntityNumber: string;
  industry: string;
  country: string;
  city: string;
  website: string;
  primaryContact: OrganizationContact;
  facilities: Facility[];
  associatedApplicationIds: string[];
  associatedCertificateIds: string[];
}

export interface InspectionChecklistItem {
  id: string;
  criterion: string;
  verified: boolean;
  notes?: string;
  severity: 'Critical' | 'Major' | 'Minor';
}

export interface InspectionRecord {
  id: string;
  inspectionRef: string;
  applicationId: string;
  applicationRef: string;
  organizationName: string;
  facilityName: string;
  facilityAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  assignedInspector: string;
  inspectorCredentials: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Report Submitted' | 'Follow-up Required';
  outcome?: 'Compliant / Recommended' | 'Conditional Approval (Minor Non-Conformance)' | 'Non-Compliant';
  checklist: InspectionChecklistItem[];
  findingsSummary?: string;
  followUpActions?: string[];
}

export interface CertificateRecord {
  id: string;
  certificateNumber: string;
  applicationId: string;
  applicationRef: string;
  organizationName: string;
  facilityName: string;
  facilityAddress: string;
  jurisdiction: string;
  governingStandard: string;
  scopeOfCertification: string;
  certifiedProducts: string[];
  issueDate: string;
  expiryDate: string;
  status: 'Active' | 'Approaching Expiry' | 'Renewal In Progress' | 'Expired' | 'Suspended';
  cryptographicSignature: string;
  sha256Digest: string;
  verificationHash: string;
  signatories: {
    role: string;
    name: string;
    designation: string;
  }[];
}

export interface RenewalRecord {
  id: string;
  certificateId: string;
  certificateNumber: string;
  organizationName: string;
  currentExpiryDate: string;
  daysRemaining: number;
  status: 'Pending Notification' | 'Notice Dispatched' | 'Renewal Application Received' | 'Audit Scheduled' | 'Overdue';
  outstandingRequirements: string[];
  lastNoticeSent?: string;
}

export interface AuditHistoryEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  targetEntity: string;
  targetRef: string;
  details: string;
  isSimulatedDemoEvent: boolean;
}
