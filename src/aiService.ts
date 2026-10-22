import type { SupportMessage } from './types/support';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Rate limiting cache (IP/Session -> timestamps)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 25;

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const requests = rateLimitMap.get(key) || [];
  const validRequests = requests.filter(ts => ts > windowStart);
  if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  validRequests.push(now);
  rateLimitMap.set(key, validRequests);
  return true;
}

export function isAiConfigured(): boolean {
  return !!(GEMINI_API_KEY || OPENAI_API_KEY || GROQ_API_KEY);
}

export function getActiveAiProvider(): string {
  if (GEMINI_API_KEY) return 'Google Gemini (gemini-2.5-flash)';
  if (OPENAI_API_KEY) return 'OpenAI (gpt-4o-mini)';
  if (GROQ_API_KEY) return 'Groq (llama-3.3-70b-versatile)';
  return 'Unconfigured';
}

const HUMAN_ESCALATION_KEYWORDS = [
  'human',
  'person',
  'agent',
  'representative',
  'real person',
  'speak to someone',
  'talk to someone',
  'speak with a human',
  'talk to a human',
  'live support',
  'customer care',
  'customer service',
  'escalate',
  'complaint',
  'manager',
  'lawyer',
  'refund',
  'billing issue',
  'fraud'
];

export function detectEscalationIntent(message: string): { shouldEscalate: boolean; reason?: string } {
  const lower = message.toLowerCase();
  
  for (const keyword of HUMAN_ESCALATION_KEYWORDS) {
    if (new RegExp(`\\b${keyword}\\b`, 'i').test(lower)) {
      return {
        shouldEscalate: true,
        reason: `Visitor explicitly requested human assistance: "${keyword}"`
      };
    }
  }

  // Check if inquiring about private specific application codes (e.g. APP-94819, HCB-2026)
  if (/\b(app|cert|inq)-[a-z0-9]{4,10}\b/i.test(lower)) {
    return {
      shouldEscalate: true,
      reason: 'Inquiry requires private applicant/certificate account lookup'
    };
  }

  return { shouldEscalate: false };
}

export const HCPT_SYSTEM_INSTRUCTION = `
You are the official AI Support Assistant for HCPT (Halal Certification Processing Technologies — website: techhalal.com).
Your purpose is to provide immediate, highly accurate, courteous, and professional assistance to website visitors, prospective Halal Certification Bodies (HCBs), food/cosmetic/pharmaceutical manufacturers, statutory auditors, and enterprise evaluators.

=== VERIFIED HCPT KNOWLEDGE & CAPABILITIES ===
1. WHAT IS HCPT?
   - Enterprise digital infrastructure platform that transforms fragmented paper-based halal certification into unified, sovereign, cryptographically secure digital workflows.
   - Built to serve Halal Certification Bodies, government statutory authorities, enterprise manufacturers, and international trade networks.
   - Designed in compliance with international halal accreditation standards, including GSO 2055-1, SMIIC 1, and JAKIM guidelines.

2. CORE CAPABILITIES:
   - "Halal Certification Portals" (/solutions/halal-certification-portals): Online intake portals for applicants, manufacturers, abattoir operators, and auditing bodies.
   - "Electronic Application Processing" (/solutions/electronic-processing): Automated intake verification, document triage, ingredient E-number biochemical cross-matching, laboratory test report ingestion, and fee reconciliation.
   - "Certification Workflow Management" (/solutions/certification-management): Orchestrates technical evaluation, on-site inspection scheduling, multi-disciplinary review gates, Shariah supervisory board ruling, and directorate approvals.
   - "Tamper-Proof Digital Certificates": Certificates sealed with ECDSA-P384 signatures, SHA-256 cryptographic digests, and QR codes linked to the HCPT central verification registry.
   - "Public Verification Registry" (/verify and /verify/:cert): Allows customs authorities, retail buyers, and consumers worldwide to instantly verify certificate authenticity.
   - "Interactive Platform Demo" (/platform-demo): Full 6-stage lifecycle demonstration available right in the browser for institutional evaluation.
   - "Institutional Consultation" (/contact): Bilateral briefings, deployment scope evaluations, and enterprise licensing for certification authorities.

3. STRICT OPERATIONAL BOUNDARIES (CRITICAL):
   - You CANNOT make statutory certification rulings, approve applications, reject dossiers, or alter certificates. Emphasize that all statutory decisions remain exclusively with accredited Islamic jurists and qualified food scientists.
   - You DO NOT disclose private records, proprietary ingredient formulations, or confidential audit dossiers belonging to other organizations.
   - You DO NOT invent pricing figures, fixed government timelines, or legal certifications that have not been published on the site.
   - If you do not know the answer with 100% certainty, say so transparently and suggest connecting with a human representative.
   - If the user requests to speak to a person, has a complaint, or needs confidential account verification, confirm that you will forward their request to the HCPT human support team immediately.

Tone: Polite, knowledgeable, enterprise-grade, authoritative yet approachable. Keep responses concise and structured with bullet points where helpful.
`;

export async function generateAiResponse(
  conversationHistory: SupportMessage[],
  latestCustomerMessage: string
): Promise<{ text: string; shouldEscalate: boolean; escalationReason?: string }> {
  // 1. Check escalation intent
  const escalation = detectEscalationIntent(latestCustomerMessage);
  if (escalation.shouldEscalate) {
    return {
      text: "I understand you need personal assistance with this matter. I'm handing this conversation over to our human support team right away. You can continue typing here, and an HCPT specialist will review your message and reply directly.",
      shouldEscalate: true,
      escalationReason: escalation.reason
    };
  }

  // 2. Check if an AI provider is configured
  if (!isAiConfigured()) {
    return {
      text: "Thank you for reaching out to HCPT. Our AI automated service is currently in setup mode (GEMINI_API_KEY or OPENAI_API_KEY is awaiting server configuration). I have routed your message to our human support desk so a team member can assist you directly.",
      shouldEscalate: true,
      escalationReason: 'AI provider unconfigured; automatic fallback to human support'
    };
  }

  // 3. Prepare recent message history (last 8 messages for context)
  const recentHistory = conversationHistory
    .filter(m => !m.isInternalNote)
    .slice(-8);

  try {
    // 3a. Try Google Gemini
    if (GEMINI_API_KEY) {
      const contents = [
        ...recentHistory.map(m => ({
          role: m.sender === 'customer' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        {
          role: 'user',
          parts: [{ text: latestCustomerMessage }]
        }
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: HCPT_SYSTEM_INSTRUCTION }]
            },
            contents,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500
            }
          }),
          signal: AbortSignal.timeout(12000)
        }
      );

      if (res.ok) {
        const data: any = await res.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim().length > 0) {
          return {
            text: candidateText.trim(),
            shouldEscalate: false
          };
        }
      } else {
        console.warn('[AI Service] Gemini error response:', res.status, await res.text());
      }
    }

    // 3b. Try OpenAI
    if (OPENAI_API_KEY) {
      const messages = [
        { role: 'system', content: HCPT_SYSTEM_INSTRUCTION },
        ...recentHistory.map(m => ({
          role: m.sender === 'customer' ? 'user' : 'assistant',
          content: m.text
        })),
        { role: 'user', content: latestCustomerMessage }
      ];

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.3,
          max_tokens: 500
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (res.ok) {
        const data: any = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content && content.trim().length > 0) {
          return {
            text: content.trim(),
            shouldEscalate: false
          };
        }
      } else {
        console.warn('[AI Service] OpenAI error response:', res.status, await res.text());
      }
    }

    // 3c. Try Groq
    if (GROQ_API_KEY) {
      const messages = [
        { role: 'system', content: HCPT_SYSTEM_INSTRUCTION },
        ...recentHistory.map(m => ({
          role: m.sender === 'customer' ? 'user' : 'assistant',
          content: m.text
        })),
        { role: 'user', content: latestCustomerMessage }
      ];

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.3,
          max_tokens: 500
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (res.ok) {
        const data: any = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content && content.trim().length > 0) {
          return {
            text: content.trim(),
            shouldEscalate: false
          };
        }
      }
    }
  } catch (err: any) {
    console.error('[AI Service] Generation error:', err?.message || err);
  }

  // Graceful fallback when provider is temporarily unreachable
  return {
    text: "I apologize, but I am having a temporary connection delay accessing our automated knowledge base. I have forwarded your message to our human support team so someone can assist you directly.",
    shouldEscalate: true,
    escalationReason: 'AI provider timeout or service interruption'
  };
}
