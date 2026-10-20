import {
  CertificationApplication,
  Organization,
  InspectionRecord,
  CertificateRecord,
  RenewalRecord,
  AuditHistoryEvent
} from '../types/certification';

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-101',
    name: 'Crescent Foods International Ltd',
    legalEntityNumber: 'CR-882910-DXB',
    industry: 'Food & Beverage Processing',
    country: 'United Arab Emirates',
    city: 'Dubai',
    website: 'https://crescentfoods.example.com',
    primaryContact: {
      fullName: 'Ahmad Rashid Al-Mansoor',
      title: 'Quality Assurance & Halal Compliance Director',
      email: 'a.mansoor@crescentfoods.example.com',
      phone: '+971 4 883 9100'
    },
    facilities: [
      {
        id: 'fac-101-a',
        name: 'Jebel Ali Central Processing Facility #4',
        address: 'Plot 392, Industrial Zone 2, JAFZA',
        city: 'Dubai',
        country: 'United Arab Emirates',
        facilityType: 'Dry & Wet Food Production',
        totalProductionLines: 6,
        lastAuditDate: '2025-11-14'
      },
      {
        id: 'fac-101-b',
        name: 'Al Quoz Cold Chain Hub',
        address: 'Street 18, Al Quoz 3',
        city: 'Dubai',
        country: 'United Arab Emirates',
        facilityType: 'Temperature Controlled Storage',
        totalProductionLines: 2,
        lastAuditDate: '2025-08-20'
      }
    ],
    associatedApplicationIds: ['app-814', 'app-890'],
    associatedCertificateIds: ['cert-9041']
  },
  {
    id: 'org-102',
    name: 'Al-Maha Flavors & Ingredients FZ-LLC',
    legalEntityNumber: 'FZ-91048-RAK',
    industry: 'Food Flavors, Extracts & Essential Oils',
    country: 'United Arab Emirates',
    city: 'Ras Al Khaimah',
    website: 'https://almahaflavors.example.com',
    primaryContact: {
      fullName: 'Dr. Soraya El-Khatib',
      title: 'Head of Regulatory Affairs & R&D',
      email: 's.khatib@almahaflavors.example.com',
      phone: '+971 7 204 4300'
    },
    facilities: [
      {
        id: 'fac-102-a',
        name: 'Al Hamra Specialty Chemical & Extract Plant',
        address: 'Al Hamra Industrial Zone, Sector D',
        city: 'Ras Al Khaimah',
        country: 'United Arab Emirates',
        facilityType: 'Bio-Fermentation & Distillation Facility',
        totalProductionLines: 4,
        lastAuditDate: '2025-10-02'
      }
    ],
    associatedApplicationIds: ['app-922'],
    associatedCertificateIds: []
  },
  {
    id: 'org-103',
    name: 'Atlas Dairy Holdings B.V.',
    legalEntityNumber: 'KVK-77492104',
    industry: 'Dairy Farming & Powder Processing',
    country: 'Netherlands',
    city: 'Rotterdam',
    website: 'https://atlasdairy.example.com',
    primaryContact: {
      fullName: 'Pieter van der Beek',
      title: 'Export Compliance Manager',
      email: 'p.vanderbeek@atlasdairy.example.com',
      phone: '+31 10 994 2100'
    },
    facilities: [
      {
        id: 'fac-103-a',
        name: 'Gouda Advanced Spray Drying Complex',
        address: 'Zuivelweg 14, 2805 PD',
        city: 'Gouda',
        country: 'Netherlands',
        facilityType: 'Milk Powder & Whey Processing',
        totalProductionLines: 5,
        lastAuditDate: '2025-12-05'
      }
    ],
    associatedApplicationIds: ['app-701'],
    associatedCertificateIds: ['cert-7019']
  },
  {
    id: 'org-104',
    name: 'Gulf Biotech Nutraceuticals Ltd',
    legalEntityNumber: 'QA-50912-DOH',
    industry: 'Pharmaceuticals & Health Supplements',
    country: 'Qatar',
    city: 'Doha',
    website: 'https://gulfbiotech.example.com',
    primaryContact: {
      fullName: 'Mariam Al-Subaey',
      title: 'QA Operations Lead',
      email: 'm.subaey@gulfbiotech.example.com',
      phone: '+974 4492 8800'
    },
    facilities: [
      {
        id: 'fac-104-a',
        name: 'Qatar Science & Technology Bio-Lab Unit 3',
        address: 'Al Rayyan Education City',
        city: 'Doha',
        country: 'Qatar',
        facilityType: 'Capsule Formulation & Cleanroom Class B',
        totalProductionLines: 3,
        lastAuditDate: '2025-06-18'
      }
    ],
    associatedApplicationIds: ['app-619'],
    associatedCertificateIds: []
  },
  {
    id: 'org-105',
    name: 'Peninsula Logistics & Cold Storage Hub',
    legalEntityNumber: 'SA-101049281',
    industry: 'Warehousing & Cold Chain Transportation',
    country: 'Saudi Arabia',
    city: 'Dammam',
    website: 'https://peninsulalogistics.example.com',
    primaryContact: {
      fullName: 'Tariq Khalid Al-Zahrani',
      title: 'Supply Chain Compliance Officer',
      email: 't.zahrani@peninsulalogistics.example.com',
      phone: '+966 13 839 2000'
    },
    facilities: [
      {
        id: 'fac-105-a',
        name: 'King Abdulaziz Port Cold Distribution Terminal',
        address: 'Terminal 4, Port Expressway',
        city: 'Dammam',
        country: 'Saudi Arabia',
        facilityType: 'Refrigerated Warehouse (-25°C to +4°C)',
        totalProductionLines: 8,
        lastAuditDate: '2026-01-10'
      }
    ],
    associatedApplicationIds: ['app-511'],
    associatedCertificateIds: ['cert-5110']
  }
];

export const INITIAL_APPLICATIONS: CertificationApplication[] = [
  {
    id: 'app-814',
    referenceNumber: 'HCPT-APP-2026-0814',
    organizationId: 'org-101',
    organizationName: 'Crescent Foods International Ltd',
    facilityName: 'Jebel Ali Central Processing Facility #4',
    facilityAddress: 'Plot 392, Industrial Zone 2, JAFZA, Dubai, UAE',
    country: 'United Arab Emirates',
    applicationType: 'New Certification',
    category: 'Food & Beverage',
    standardsCompliance: ['OIC/SMIIC 1:2019', 'GSO 2055-1:2015', 'MS 1500:2019'],
    status: 'Technical Review',
    submissionDate: '2026-02-18',
    lastUpdated: '2026-03-02',
    leadReviewer: 'Eng. Zayd Al-Ghamdi',
    technicalAssessor: 'Dr. Mona Al-Saeed',
    products: [
      { id: 'p-1', name: 'Al-Rawdah Premium Poultry Seasoning (250g)', sku: 'CF-SEA-01', brand: 'Al-Rawdah', ingredientsCount: 14, originCountry: 'UAE' },
      { id: 'p-2', name: 'Smoked Paprika Marinade Base (5L Commercial)', sku: 'CF-MAR-05', brand: 'Culinary Master', ingredientsCount: 8, originCountry: 'Spain/UAE' },
      { id: 'p-3', name: 'Organic Pure Date Syrup Concentrate', sku: 'CF-DAT-09', brand: 'Barakah Natural', ingredientsCount: 1, originCountry: 'Oman' }
    ],
    documents: [
      {
        id: 'doc-814-1',
        name: 'Master Raw Material Specification & Supplier Halal Certificates',
        category: 'Ingredient Traceability',
        fileName: 'Raw_Material_Master_Batch_2026.pdf',
        fileSize: '4.8 MB',
        uploadedAt: '2026-02-18 10:14',
        version: 'v2.1',
        status: 'Approved',
        reviewNotes: 'All 23 supplier ingredient certificates verified against ISO 17065 accredited bodies.'
      },
      {
        id: 'doc-814-2',
        name: 'Third-Party Laboratory GC-MS Alcohol & Porcine DNA PCR Assay',
        category: 'Lab Analysis Report',
        fileName: 'Lab_Report_Eurofins_DNA_Ethanol_Feb2026.pdf',
        fileSize: '1.9 MB',
        uploadedAt: '2026-02-18 10:20',
        version: 'v1.0',
        status: 'Approved',
        reviewNotes: 'Zero porcine DNA detected; residual ethanol below 0.05% threshold (0.012% measured).'
      },
      {
        id: 'doc-814-3',
        name: 'JAFZA Production Line Cleaning & Sanitation Flowchart (CIP)',
        category: 'Process Flowchart',
        fileName: 'Line_CIP_Sanitation_SOP_Rev4.pdf',
        fileSize: '2.4 MB',
        uploadedAt: '2026-02-18 11:05',
        version: 'v4.0',
        status: 'Under Review',
        reviewNotes: 'Awaiting assessor confirmation on dedicated line validation protocols.'
      },
      {
        id: 'doc-814-4',
        name: 'Halal Assurance System (HAS) Governance Manual 2026',
        category: 'Halal Assurance System (HAS)',
        fileName: 'HAS_Manual_CrescentFoods_2026.pdf',
        fileSize: '6.2 MB',
        uploadedAt: '2026-02-18 11:30',
        version: 'v1.3',
        status: 'Approved',
        reviewNotes: 'Halal committee structure, internal audit schedule, and recall protocols documented.'
      }
    ],
    timeline: [
      {
        id: 'tl-1',
        status: 'Draft',
        actor: 'Ahmad Rashid Al-Mansoor',
        role: 'Applicant QA Director',
        description: 'Application created and product schedule populated.',
        timestamp: '2026-02-15 09:30'
      },
      {
        id: 'tl-2',
        status: 'Submitted',
        actor: 'Ahmad Rashid Al-Mansoor',
        role: 'Applicant QA Director',
        description: 'Electronic submission completed with 4 core evidence packages.',
        timestamp: '2026-02-18 11:45'
      },
      {
        id: 'tl-3',
        status: 'Initial Review',
        actor: 'Eng. Zayd Al-Ghamdi',
        role: 'Lead Application Assessor',
        description: 'Initial document completeness review started. Mandatory fees verified.',
        timestamp: '2026-02-19 14:10'
      },
      {
        id: 'tl-4',
        status: 'Technical Review',
        actor: 'Eng. Zayd Al-Ghamdi',
        role: 'Lead Application Assessor',
        description: 'Passed initial triage. Advanced to Shariah & Technical Assessment committee.',
        timestamp: '2026-02-23 08:50'
      }
    ],
    notes: [
      {
        id: 'note-1',
        author: 'Eng. Zayd Al-Ghamdi',
        role: 'Lead Application Assessor',
        content: 'Applicant has comprehensive documentation. Ingredient #12 (natural aroma compound) is backed by an accredited JAKIM-recognized body certificate.',
        timestamp: '2026-02-23 09:15',
        isInternal: true
      },
      {
        id: 'note-2',
        author: 'Dr. Mona Al-Saeed',
        role: 'Technical Assessor',
        content: 'Reviewing CIP sanitization cycle times. Line 2 handles shared equipment for seasonal vinegar marinades; need verification that cleaning protocol ensures absence of najis/cross-contamination.',
        timestamp: '2026-03-01 16:40',
        isInternal: true
      }
    ],
    missingInfoRequests: []
  },
  {
    id: 'app-922',
    referenceNumber: 'HCPT-APP-2026-0922',
    organizationId: 'org-102',
    organizationName: 'Al-Maha Flavors & Ingredients FZ-LLC',
    facilityName: 'Al Hamra Specialty Chemical & Extract Plant',
    facilityAddress: 'Al Hamra Industrial Zone, Sector D, Ras Al Khaimah, UAE',
    country: 'United Arab Emirates',
    applicationType: 'New Certification',
    category: 'Ingredients & Additives',
    standardsCompliance: ['GSO 2055-1:2015', 'HAS 23000 / SJPH'],
    status: 'Inspection Scheduled',
    submissionDate: '2026-01-28',
    lastUpdated: '2026-03-01',
    leadReviewer: 'Fatima Al-Nuaimi',
    technicalAssessor: 'Dr. Tariq Al-Hashimi',
    assignedInspector: 'Auditor Salim Al-Busaidi',
    inspectionId: 'insp-402',
    products: [
      { id: 'p-4', name: 'Natural Citral Essence (Solvent-Free Distillation)', sku: 'AM-CIT-99', brand: 'Al-Maha Extracts', ingredientsCount: 1, originCountry: 'UAE' },
      { id: 'p-5', name: 'Vegetable-Based Glycerol Monooleate (E471)', sku: 'AM-GMO-471', brand: 'BioEsters', ingredientsCount: 3, originCountry: 'Malaysia/UAE' }
    ],
    documents: [
      {
        id: 'doc-922-1',
        name: 'Fractional Distillation Column P&ID Schematics',
        category: 'Process Flowchart',
        fileName: 'PID_Distillation_Column_3.pdf',
        fileSize: '5.1 MB',
        uploadedAt: '2026-01-28 14:02',
        version: 'v1.0',
        status: 'Approved'
      },
      {
        id: 'doc-922-2',
        name: 'Palm Oil Sustainable Origin Certification & Non-Animal Derivation Attestation',
        category: 'Ingredient Traceability',
        fileName: 'Palm_Derivation_Attestation_E471.pdf',
        fileSize: '3.1 MB',
        uploadedAt: '2026-01-28 14:15',
        version: 'v1.1',
        status: 'Approved'
      }
    ],
    timeline: [
      {
        id: 'tl-5',
        status: 'Submitted',
        actor: 'Dr. Soraya El-Khatib',
        role: 'Applicant R&D Lead',
        description: 'Submission lodged with statutory fee confirmation.',
        timestamp: '2026-01-28 15:00'
      },
      {
        id: 'tl-6',
        status: 'Initial Review',
        actor: 'Fatima Al-Nuaimi',
        role: 'Assessor',
        description: 'Initial review approved without deficiency notice.',
        timestamp: '2026-01-30 11:20'
      },
      {
        id: 'tl-7',
        status: 'Technical Review',
        actor: 'Dr. Tariq Al-Hashimi',
        role: 'Senior Technical Assessor',
        description: 'Technical evaluation of non-animal source validated. On-site audit required for solvent verification.',
        timestamp: '2026-02-10 16:30'
      },
      {
        id: 'tl-8',
        status: 'Inspection Scheduled',
        actor: 'Inspection Dispatch Desk',
        role: 'Operations Desk',
        description: 'On-site audit confirmed with facility management for March 12, 2026.',
        timestamp: '2026-02-25 10:00'
      }
    ],
    notes: [
      {
        id: 'note-3',
        author: 'Auditor Salim Al-Busaidi',
        role: 'Field Assessor',
        content: 'Pre-audit briefing scheduled with plant manager. Physical verification of extraction solvents and storage vessel segregation will be prime focus.',
        timestamp: '2026-02-26 11:45',
        isInternal: true
      }
    ],
    missingInfoRequests: []
  },
  {
    id: 'app-701',
    referenceNumber: 'HCPT-APP-2025-0701',
    organizationId: 'org-103',
    organizationName: 'Atlas Dairy Holdings B.V.',
    facilityName: 'Gouda Advanced Spray Drying Complex',
    facilityAddress: 'Zuivelweg 14, 2805 PD, Gouda, Netherlands',
    country: 'Netherlands',
    applicationType: 'Recertification / Renewal',
    category: 'Food & Beverage',
    standardsCompliance: ['OIC/SMIIC 1:2019', 'GSO 2055-1:2015'],
    status: 'Approved',
    submissionDate: '2025-11-10',
    lastUpdated: '2026-02-20',
    leadReviewer: 'Dr. Tariq Al-Hashimi',
    technicalAssessor: 'Sheikh M. Noorudeen',
    assignedInspector: 'Auditor Erik De Jong',
    certificateId: 'cert-7019',
    products: [
      { id: 'p-6', name: 'Halal Certified Spray-Dried Sweet Whey Powder (Mesh 100)', sku: 'AD-WHEY-100', brand: 'Atlas Pure', ingredientsCount: 1, originCountry: 'Netherlands' },
      { id: 'p-7', name: 'Micro-Filtered Skimmed Milk Powder (Instant Grade)', sku: 'AD-SMP-INST', brand: 'Atlas Pure', ingredientsCount: 1, originCountry: 'Netherlands' }
    ],
    documents: [
      {
        id: 'doc-701-1',
        name: 'Microbial Rennet Enzymer Specification & Non-GMO Verification',
        category: 'Ingredient Traceability',
        fileName: 'Microbial_Rennet_Assay_Cert.pdf',
        fileSize: '1.7 MB',
        uploadedAt: '2025-11-10 09:30',
        version: 'v3.0',
        status: 'Approved'
      },
      {
        id: 'doc-701-2',
        name: 'On-Site Field Audit Verification Report & Hygiene Swab Analyses',
        category: 'Lab Analysis Report',
        fileName: 'Audit_Report_Atlas_Gouda_Nov2025.pdf',
        fileSize: '4.2 MB',
        uploadedAt: '2025-12-15 14:00',
        version: 'v1.0',
        status: 'Approved'
      }
    ],
    timeline: [
      {
        id: 'tl-9',
        status: 'Submitted',
        actor: 'Pieter van der Beek',
        role: 'Applicant QA Director',
        description: 'Renewal submission lodged.',
        timestamp: '2025-11-10 10:00'
      },
      {
        id: 'tl-10',
        status: 'Inspection Completed',
        actor: 'Auditor Erik De Jong',
        role: 'Field Auditor',
        description: 'Facility audit concluded with zero major non-conformances.',
        timestamp: '2025-12-12 17:00'
      },
      {
        id: 'tl-11',
        status: 'Decision Pending',
        actor: 'Dr. Tariq Al-Hashimi',
        role: 'Lead Assessor',
        description: 'Dossier passed to Certification Supervisory Committee.',
        timestamp: '2026-01-15 09:30'
      },
      {
        id: 'tl-12',
        status: 'Approved',
        actor: 'Shariah Supervisory Committee',
        role: 'Executive Authority',
        description: 'Approved for annual certificate re-issuance.',
        timestamp: '2026-02-20 11:00'
      }
    ],
    notes: [
      {
        id: 'note-4',
        author: 'Sheikh M. Noorudeen',
        role: 'Shariah Board Member',
        content: 'Rennet source confirmed 100% microbial (Rhizomucor miehei). No animal-derived calf rennet present on premises.',
        timestamp: '2026-02-19 15:30',
        isInternal: true
      }
    ],
    missingInfoRequests: []
  },
  {
    id: 'app-619',
    referenceNumber: 'HCPT-APP-2026-0619',
    organizationId: 'org-104',
    organizationName: 'Gulf Biotech Nutraceuticals Ltd',
    facilityName: 'Qatar Science & Technology Bio-Lab Unit 3',
    facilityAddress: 'Al Rayyan Education City, Doha, Qatar',
    country: 'Qatar',
    applicationType: 'New Certification',
    category: 'Pharmaceuticals',
    standardsCompliance: ['GSO 2055-1:2015', 'OIC/SMIIC 1:2019'],
    status: 'Awaiting Applicant Information',
    submissionDate: '2026-02-01',
    lastUpdated: '2026-02-28',
    leadReviewer: 'Fatima Al-Nuaimi',
    technicalAssessor: 'Dr. Mona Al-Saeed',
    products: [
      { id: 'p-8', name: 'Pure Marine Collagen Peptides (Type I & III)', sku: 'GB-COL-300', brand: 'NutriMarine', ingredientsCount: 2, originCountry: 'Norway/Qatar' },
      { id: 'p-9', name: 'Vegan CoQ10 Softgels with Phytosterols', sku: 'GB-COQ-100', brand: 'BioVitality', ingredientsCount: 5, originCountry: 'Qatar' }
    ],
    documents: [
      {
        id: 'doc-619-1',
        name: 'Softgel Shell Capsule Raw Material Sourcing Declaration',
        category: 'Ingredient Traceability',
        fileName: 'Capsule_Shell_Gelatin_Declaration.pdf',
        fileSize: '1.2 MB',
        uploadedAt: '2026-02-01 11:20',
        version: 'v1.0',
        status: 'Needs Revision',
        reviewNotes: 'Bovine gelatin source certificate expired on Dec 31, 2025. Current batch requires renewed accreditation certificate.'
      }
    ],
    timeline: [
      {
        id: 'tl-13',
        status: 'Submitted',
        actor: 'Mariam Al-Subaey',
        role: 'Applicant QA',
        description: 'Application submitted for pharmaceutical line.',
        timestamp: '2026-02-01 12:00'
      },
      {
        id: 'tl-14',
        status: 'Initial Review',
        actor: 'Fatima Al-Nuaimi',
        role: 'Lead Assessor',
        description: 'Triage complete. Discrepancy identified in bovine gelatin supplier certificate.',
        timestamp: '2026-02-08 14:30'
      },
      {
        id: 'tl-15',
        status: 'Awaiting Applicant Information',
        actor: 'Fatima Al-Nuaimi',
        role: 'Lead Assessor',
        description: 'Formal RFI dispatched: valid Halal certificate for gelatin capsules required.',
        timestamp: '2026-02-12 09:15'
      }
    ],
    notes: [
      {
        id: 'note-5',
        author: 'Fatima Al-Nuaimi',
        role: 'Lead Assessor',
        content: 'Softgel capsule shell uses bovine gelatin. Supplier certificate was expired. Applicant notified via automated portal notification.',
        timestamp: '2026-02-12 09:20',
        isInternal: false
      }
    ],
    missingInfoRequests: [
      {
        id: 'rfi-619-1',
        requestedFields: ['Current Valid Bovine Gelatin Halal Certificate', 'Slaughter Protocol Verification (SMIIC 1 compliant)'],
        message: 'The submitted halal certificate for bovine gelatin batch supplier GEL-992 expired on 31-Dec-2025. Please provide an active certificate from an accredited body or substantiate plant-based HPMC substitution.',
        requestedBy: 'Fatima Al-Nuaimi',
        requestedAt: '2026-02-12 09:15',
        status: 'Pending Response'
      }
    ]
  },
  {
    id: 'app-511',
    referenceNumber: 'HCPT-APP-2025-0511',
    organizationId: 'org-105',
    organizationName: 'Peninsula Logistics & Cold Storage Hub',
    facilityName: 'King Abdulaziz Port Cold Distribution Terminal',
    facilityAddress: 'Terminal 4, Port Expressway, Dammam, Saudi Arabia',
    country: 'Saudi Arabia',
    applicationType: 'New Certification',
    category: 'Logistics & Warehousing',
    standardsCompliance: ['GSO 2055-1:2015', 'OIC/SMIIC 1:2019'],
    status: 'Certificate Issued',
    submissionDate: '2025-09-14',
    lastUpdated: '2026-01-20',
    leadReviewer: 'Eng. Zayd Al-Ghamdi',
    technicalAssessor: 'Sheikh M. Noorudeen',
    assignedInspector: 'Auditor Salim Al-Busaidi',
    certificateId: 'cert-5110',
    products: [
      { id: 'p-10', name: 'Cold Storage & Pallet Warehousing Service (-25°C to +4°C)', sku: 'LOG-COLD-01', brand: 'Peninsula Logistics', ingredientsCount: 0, originCountry: 'Saudi Arabia' }
    ],
    documents: [
      {
        id: 'doc-511-1',
        name: 'Halal Separation & Segregation Protocol Manual (Cold Chain)',
        category: 'Halal Assurance System (HAS)',
        fileName: 'ColdChain_Segregation_Protocol.pdf',
        fileSize: '3.8 MB',
        uploadedAt: '2025-09-14 13:00',
        version: 'v2.0',
        status: 'Approved'
      }
    ],
    timeline: [
      {
        id: 'tl-16',
        status: 'Submitted',
        actor: 'Tariq Khalid Al-Zahrani',
        role: 'Applicant QA',
        description: 'Submission completed.',
        timestamp: '2025-09-14 14:00'
      },
      {
        id: 'tl-17',
        status: 'Certificate Issued',
        actor: 'Certification Directorate',
        role: 'Issuing Officer',
        description: 'Cryptographically sealed certificate generated and published to registry.',
        timestamp: '2026-01-20 11:30'
      }
    ],
    notes: [
      {
        id: 'note-6',
        author: 'Eng. Zayd Al-Ghamdi',
        role: 'Lead Assessor',
        content: 'Zero non-halal cross-docking observed. Complete segregation verified with digital temperature sensor telemetry.',
        timestamp: '2026-01-18 10:15',
        isInternal: true
      }
    ],
    missingInfoRequests: []
  }
];

export const INITIAL_INSPECTIONS: InspectionRecord[] = [
  {
    id: 'insp-402',
    inspectionRef: 'HCPT-INSP-2026-0402',
    applicationId: 'app-922',
    applicationRef: 'HCPT-APP-2026-0922',
    organizationName: 'Al-Maha Flavors & Ingredients FZ-LLC',
    facilityName: 'Al Hamra Specialty Chemical & Extract Plant',
    facilityAddress: 'Al Hamra Industrial Zone, Sector D, Ras Al Khaimah, UAE',
    scheduledDate: '2026-03-12',
    scheduledTime: '09:00 - 15:30 GST',
    assignedInspector: 'Auditor Salim Al-Busaidi',
    inspectorCredentials: 'Lead Halal Assessor (ISO 17065 & SMIIC)',
    status: 'Scheduled',
    checklist: [
      { id: 'c-1', criterion: 'Physical inspection of raw material storage & non-halal segregation', verified: false, severity: 'Critical' },
      { id: 'c-2', criterion: 'Distillation column clean-in-place (CIP) protocol verification & solvent logs', verified: false, severity: 'Critical' },
      { id: 'c-3', criterion: 'Verification of non-animal source for glycerol monooleate production line', verified: false, severity: 'Critical' },
      { id: 'c-4', criterion: 'Inspection of packaging line air filtration and pest management records', verified: false, severity: 'Minor' },
      { id: 'c-5', criterion: 'Halal Internal Audit Committee meeting minutes & employee training verification', verified: false, severity: 'Major' }
    ]
  },
  {
    id: 'insp-398',
    inspectionRef: 'HCPT-INSP-2025-0398',
    applicationId: 'app-701',
    applicationRef: 'HCPT-APP-2025-0701',
    organizationName: 'Atlas Dairy Holdings B.V.',
    facilityName: 'Gouda Advanced Spray Drying Complex',
    facilityAddress: 'Zuivelweg 14, 2805 PD, Gouda, Netherlands',
    scheduledDate: '2025-12-12',
    scheduledTime: '10:00 - 16:00 CET',
    assignedInspector: 'Auditor Erik De Jong',
    inspectorCredentials: 'Senior Food Safety & Halal Specialist',
    status: 'Completed',
    outcome: 'Compliant / Recommended',
    checklist: [
      { id: 'c-6', criterion: 'Raw milk receiving bay segregated intake logs', verified: true, severity: 'Critical' },
      { id: 'c-7', criterion: 'Microbial rennet storage verification vs master formula', verified: true, severity: 'Critical' },
      { id: 'c-8', criterion: 'Spray drying tower sanitation protocol between batches', verified: true, severity: 'Major' },
      { id: 'c-9', criterion: 'Finished powder packaging seal integrity and tamper verification', verified: true, severity: 'Minor' }
    ],
    findingsSummary: 'Plant demonstrates exceptional GMP and strict Halal Assurance System compliance. Zero cross-contamination risks identified.',
    followUpActions: ['Annual re-verification of enzyme vendor renewal certificates.']
  }
];

export const INITIAL_CERTIFICATES: CertificateRecord[] = [
  {
    id: 'cert-9041',
    certificateNumber: 'HCPT-CERT-2025-9041',
    applicationId: 'app-814',
    applicationRef: 'HCPT-APP-2025-0412',
    organizationName: 'Crescent Foods International Ltd',
    facilityName: 'Jebel Ali Central Processing Facility #4',
    facilityAddress: 'Plot 392, Industrial Zone 2, JAFZA, Dubai, UAE',
    jurisdiction: 'United Arab Emirates & GCC (GSO Standard)',
    governingStandard: 'GSO 2055-1:2015 / OIC/SMIIC 1:2019',
    scopeOfCertification: 'Manufacture and distribution of processed seasonings, date concentrates, and culinary food marinades',
    certifiedProducts: [
      'Al-Rawdah Premium Poultry Seasoning (250g)',
      'Organic Pure Date Syrup Concentrate (500g, 1L)',
      'Culinary Master Seasoned Breading Mix (10kg)'
    ],
    issueDate: '2025-04-15',
    expiryDate: '2026-04-14',
    status: 'Approaching Expiry',
    cryptographicSignature: 'ECDSA-P384:HCPT-SIG:48B9-A210-9F5C-DXB',
    sha256Digest: '9a7e6c3f0b248a4d93e1150fc7d2c388a1492b45e99c1585d56b4ec24177d61f',
    verificationHash: 'V-9041-SMIIC-DXB',
    signatories: [
      { role: 'Chairman of Shariah Supervisory Board', name: 'Sheikh M. Noorudeen', designation: 'Senior Islamic Jurist' },
      { role: 'Director General of Certification', name: 'Dr. Tariq Al-Hashimi', designation: 'Technical Assurance Lead' }
    ]
  },
  {
    id: 'cert-7019',
    certificateNumber: 'HCPT-CERT-2026-7019',
    applicationId: 'app-701',
    applicationRef: 'HCPT-APP-2025-0701',
    organizationName: 'Atlas Dairy Holdings B.V.',
    facilityName: 'Gouda Advanced Spray Drying Complex',
    facilityAddress: 'Zuivelweg 14, 2805 PD, Gouda, Netherlands',
    jurisdiction: 'European Union & OIC Export Recognition',
    governingStandard: 'OIC/SMIIC 1:2019 / MS 1500:2019',
    scopeOfCertification: 'Production and export of spray-dried sweet whey powder and micro-filtered skimmed milk powder',
    certifiedProducts: [
      'Halal Certified Spray-Dried Sweet Whey Powder (Mesh 100)',
      'Micro-Filtered Skimmed Milk Powder (Instant Grade)'
    ],
    issueDate: '2026-02-22',
    expiryDate: '2027-02-21',
    status: 'Active',
    cryptographicSignature: 'ECDSA-P384:HCPT-SIG:71CC-8092-B4D1-AMS',
    sha256Digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    verificationHash: 'V-7019-SMIIC-AMS',
    signatories: [
      { role: 'Chairman of Shariah Supervisory Board', name: 'Sheikh M. Noorudeen', designation: 'Senior Islamic Jurist' },
      { role: 'Director General of Certification', name: 'Dr. Tariq Al-Hashimi', designation: 'Technical Assurance Lead' }
    ]
  },
  {
    id: 'cert-5110',
    certificateNumber: 'HCPT-CERT-2026-5110',
    applicationId: 'app-511',
    applicationRef: 'HCPT-APP-2025-0511',
    organizationName: 'Peninsula Logistics & Cold Storage Hub',
    facilityName: 'King Abdulaziz Port Cold Distribution Terminal',
    facilityAddress: 'Terminal 4, Port Expressway, Dammam, Saudi Arabia',
    jurisdiction: 'Kingdom of Saudi Arabia & GCC',
    governingStandard: 'GSO 2055-1:2015 / OIC/SMIIC 1:2019',
    scopeOfCertification: 'Temperature controlled multi-chamber halal cold storage, consolidation, and cross-docking logistics',
    certifiedProducts: [
      'Cold Storage & Pallet Warehousing Service (-25°C to +4°C)'
    ],
    issueDate: '2026-01-20',
    expiryDate: '2027-01-19',
    status: 'Active',
    cryptographicSignature: 'ECDSA-P384:HCPT-SIG:92AA-5110-33FC-DMM',
    sha256Digest: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    verificationHash: 'V-5110-GSO-DMM',
    signatories: [
      { role: 'Regional Inspection Director', name: 'Eng. Zayd Al-Ghamdi', designation: 'Gulf Logistics Auditor' },
      { role: 'Director General of Certification', name: 'Dr. Tariq Al-Hashimi', designation: 'Technical Assurance Lead' }
    ]
  }
];

export const INITIAL_RENEWALS: RenewalRecord[] = [
  {
    id: 'ren-001',
    certificateId: 'cert-9041',
    certificateNumber: 'HCPT-CERT-2025-9041',
    organizationName: 'Crescent Foods International Ltd',
    currentExpiryDate: '2026-04-14',
    daysRemaining: 25,
    status: 'Notice Dispatched',
    outstandingRequirements: [
      'Updated laboratory pesticide & heavy metal screen for date syrup',
      'Renewed supplier halal attestation for packaging foil',
      'HAS annual internal audit summary report'
    ],
    lastNoticeSent: '2026-02-28'
  },
  {
    id: 'ren-002',
    certificateId: 'cert-3042',
    certificateNumber: 'HCPT-CERT-2025-3042',
    organizationName: 'Nusantara Bio-Derivatives SDN BHD',
    currentExpiryDate: '2026-03-30',
    daysRemaining: 10,
    status: 'Renewal Application Received',
    outstandingRequirements: [
      'Scheduling of on-site surveillance audit'
    ],
    lastNoticeSent: '2026-02-15'
  }
];

export const INITIAL_AUDIT_LOGS: AuditHistoryEvent[] = [
  {
    id: 'log-101',
    timestamp: '2026-03-02 11:30:14',
    actor: 'Eng. Zayd Al-Ghamdi',
    role: 'Lead Application Assessor',
    action: 'STATUS_TRANSITION',
    targetEntity: 'Application',
    targetRef: 'HCPT-APP-2026-0814',
    details: 'Application moved from Initial Review to Technical Review following ingredient dossier verification.',
    isSimulatedDemoEvent: true
  },
  {
    id: 'log-102',
    timestamp: '2026-03-01 16:42:00',
    actor: 'Dr. Mona Al-Saeed',
    role: 'Technical Assessor',
    action: 'DOCUMENT_REVIEWED',
    targetEntity: 'Document',
    targetRef: 'doc-814-2',
    details: 'Eurofins PCR & GC-MS analysis approved. Ethanol 0.012%, zero porcine DNA.',
    isSimulatedDemoEvent: true
  },
  {
    id: 'log-103',
    timestamp: '2026-02-25 10:00:22',
    actor: 'Operations Desk',
    role: 'Inspection Coordinator',
    action: 'INSPECTION_SCHEDULED',
    targetEntity: 'Inspection',
    targetRef: 'HCPT-INSP-2026-0402',
    details: 'Scheduled on-site field assessment for Al Hamra facility with Auditor Salim Al-Busaidi.',
    isSimulatedDemoEvent: true
  },
  {
    id: 'log-104',
    timestamp: '2026-02-20 11:00:00',
    actor: 'Certification Supervisory Committee',
    role: 'Executive Authority',
    action: 'COMPLIANCE_DECISION_RECORDED',
    targetEntity: 'Application',
    targetRef: 'HCPT-APP-2025-0701',
    details: 'Approved for certificate issuance under OIC/SMIIC 1:2019 standard.',
    isSimulatedDemoEvent: true
  },
  {
    id: 'log-105',
    timestamp: '2026-01-20 11:30:00',
    actor: 'Certification Directorate',
    role: 'Issuing Officer',
    action: 'CERTIFICATE_GENERATED',
    targetEntity: 'Certificate',
    targetRef: 'HCPT-CERT-2026-5110',
    details: 'Cryptographically sealed certificate generated. Digital seal SHA-256 checksum embedded.',
    isSimulatedDemoEvent: true
  }
];
