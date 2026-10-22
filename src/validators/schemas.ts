import { z } from 'zod';

export const ApplicationStatusEnum = z.enum([
  'Draft',
  'Submitted',
  'Initial Review',
  'Awaiting Applicant Information',
  'Technical Review',
  'Inspection Scheduled',
  'Inspection Completed',
  'Decision Pending',
  'Approved',
  'Rejected',
  'Certificate Issued',
  'Renewal Due',
  'Closed'
]);

export const StatusUpdateSchema = z.object({
  status: ApplicationStatusEnum,
  reason: z.string().min(5, 'Reason must be at least 5 characters for compliance audit trails.'),
  actor: z.string().optional()
});

export const ContactInquirySchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  organizationName: z.string().min(2, 'Organization name is required.'),
  officialEmail: z.string().email('Please enter a valid official institutional email.'),
  phoneNumber: z.string().optional(),
  jurisdiction: z.string().min(2, 'Jurisdiction is required.'),
  currentSystem: z.string().min(1, 'Please select your current operational model.'),
  annualCertificates: z.string().min(1, 'Please select estimated annual volume.'),
  inquiryDetails: z.string().min(10, 'Please describe your digital certification processing requirements.')
});

export const ScheduleInspectionSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required.'),
  scheduledDate: z.string().min(8, 'Scheduled date is required.'),
  scheduledTime: z.string().min(3, 'Scheduled time is required.'),
  assignedInspector: z.string().min(2, 'Inspector assignment is required.'),
  checklistItems: z.array(z.string()).min(1, 'At least one checklist item is required.')
});

export const ReviewNoteSchema = z.object({
  content: z.string().min(5, 'Note content must be at least 5 characters.'),
  author: z.string().min(2, 'Author name is required.'),
  role: z.string().min(2, 'Author role is required.'),
  isInternal: z.boolean().default(true)
});

export const RequestInfoSchema = z.object({
  fields: z.array(z.string()).min(1, 'At least one missing field must be specified.'),
  message: z.string().min(10, 'Instructions must be at least 10 characters.'),
  requestedBy: z.string().min(2, 'Reviewer identity is required.')
});

export const SupportChatRequestSchema = z.object({
  conversationId: z.string().optional(),
  sessionToken: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty.').max(1500, 'Message is too long (max 1500 characters).'),
  customerInfo: z.object({
    name: z.string().max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(),
    organization: z.string().max(100).optional(),
    visitorLocation: z.object({
      city: z.string().optional(),
      region: z.string().optional(),
      country: z.string().optional(),
      countryCode: z.string().optional(),
      flag: z.string().optional()
    }).optional()
  }).optional()
});

export const SupportReplyRequestSchema = z.object({
  text: z.string().min(1, 'Reply cannot be empty.').max(2500, 'Reply exceeds maximum length of 2500 characters.'),
  authorName: z.string().optional()
});

export const SupportInternalNoteSchema = z.object({
  text: z.string().min(1, 'Note cannot be empty.').max(2000, 'Note exceeds maximum length.'),
  author: z.string().optional()
});

export const SupportStatusUpdateSchema = z.object({
  status: z.enum(['open', 'awaiting_human', 'human_handling', 'resolved']),
  handlingMode: z.enum(['ai', 'human']).optional(),
  priority: z.enum(['normal', 'high', 'urgent']).optional(),
  assignedAgent: z.string().optional()
});

