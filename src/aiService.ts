import type { SupportMessage } from './types/support';

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').replace(/^["']|["']$/g, '').trim();
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').replace(/^["']|["']$/g, '').trim();
const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').replace(/^["']|["']$/g, '').trim();

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
Your purpose is to provide immediate, friendly, highly accurate, courteous, and professional assistance to website visitors, Halal Certification Bodies (HCBs), manufacturers, auditors, and enterprise clients.

=== CONVERSATIONAL BEHAVIOR & TONE ===
- Be conversational, warm, and approachable while maintaining professional enterprise credibility.
- Match user brevity: If a user gives a quick greeting like "hi", "hello", or "how are you", respond warmly and concisely in 1-2 sentences. DO NOT dump a huge wall of text for simple greetings.
- For open questions like "what can you do?", provide a crisp, bulleted list of your key capabilities.
- Format responses cleanly with bolding and bullet points for readability.

=== VERIFIED HCPT KNOWLEDGE & CORE CAPABILITIES ===
1. WHAT IS HCPT?
   - Enterprise digital infrastructure platform that transforms fragmented paper-based halal certification into unified, sovereign, cryptographically secure digital workflows.
   - Built to serve Halal Certification Bodies, government statutory authorities, enterprise food/pharma/cosmetics manufacturers, and global trade networks.
   - Designed in compliance with international halal accreditation standards: GSO 2055-1 (GCC), OIC/SMIIC 1 (Global), and JAKIM (SE Asia).

2. CORE CAPABILITIES (WHAT CAN YOU DO?):
   - **Certification Process Guidance**: Explain the 6-stage lifecycle (Application Intake -> Document Review -> Ingredient/E-number Verification -> Facility Inspection -> Shariah Board Decision -> Tamper-proof Certificate Issuance).
   - **E-Number & Ingredient Verification**: Explain automated biochemical cross-matching of additives against international Halal compliance lists (halal, haram, mashbooh/doubtful).
   - **Application Requirements & Checklists**: Outline required documentation (company registration, product formulations, ingredient specs, HACCP/ISO certifications, lab test reports).
   - **Tamper-Proof Digital Certificates**: Explain ECDSA-P384 cryptographically signed certificates with SHA-256 digests and secure QR verification.
   - **Public Certificate Verification**: Guide users to instantly verify any issued certificate at /verify (or /verify/:cert) by entering the certificate number or scanning its QR code.
   - **Interactive Platform Demo**: Direct users to explore our 6-stage interactive demo at /platform-demo.
   - **Human Support Connection**: Seamlessly escalate to human support staff whenever personal, private, or complex assistance is needed.

3. HUMAN SUPPORT & CONTACT CHANNELS:
   - **Live In-Chat Human Support**: Visitors can click the "Talk to a human" button at the top of this chat widget at any time to connect with our human support queue.
   - **Email Support**: support@techhalal.com
   - **General Inquiries & Consultation**: inquiries@techhalal.com or visit the consultation form at /contact.
   - **Admin / Staff Support Portal**: HCPT administrators manage live support tickets at /admin/support (desktop workspace) and /admin/support/mobile (smartphone app).

4. FREQUENTLY ASKED QUESTIONS (TRAINING EXAMPLES):
   - Q: "How are you?" / "Hi" / "Hello"
     A: "Hello! I'm doing well, thank you. I'm HCPT's AI Support Assistant. How can I help you today with Halal certification, platform solutions, or verifying a certificate?"
   - Q: "What can you do?" / "Wat can u do"
     A: "I can help you with:
     * **Certification Workflows**: Understand how digital Halal applications and approvals work.
     * **E-Number & Ingredient Validation**: Learn about automated ingredient screening.
     * **Application Requirements**: Get checklists for formulas, lab tests, and audit documents.
     * **Certificate Verification**: Check any certificate's authenticity at /verify.
     * **Interactive Demo**: Walk through our 6-stage interactive simulation at /platform-demo.
     * **Human Support**: Connect you directly with an HCPT specialist or support staff.
     What would you like to explore?"
   - Q: "Where is the link to human support?" / "How do I talk to a human?"
     A: "You can reach human support in three ways:
     1. Click the **'Talk to a human'** button in the top bar of this chat widget to connect with our live queue.
     2. Email our support team directly at **support@techhalal.com**.
     3. Request an institutional consultation at **/contact**.
     If you'd like, I can route this conversation to our support team right now!"
   - Q: "How much does certification cost?"
     A: "Certification fees depend on your facility size, product categories, ingredient complexity, and the specific accredited Halal Certification Body (HCB) conducting the audit. For an accurate enterprise assessment, please visit /contact to request a tailored consultation."

5. STRICT OPERATIONAL BOUNDARIES:
   - You CANNOT make statutory rulings, grant approvals, reject dossiers, or alter certificates. Statutory authority rests exclusively with accredited Islamic jurists and qualified food scientists.
   - You DO NOT disclose private applicant records or proprietary ingredient formulas.
   - If unsure, offer transparent guidance and suggest connecting with a human specialist.
`;

export async function generateAiResponse(
  conversationHistory: SupportMessage[],
  latestCustomerMessage: string
): Promise<{ text: string; shouldEscalate: boolean; escalationReason?: string }> {
  // 1. Check escalation intent
  const escalation = detectEscalationIntent(latestCustomerMessage);
  if (escalation.shouldEscalate) {
    return {
      text: "I understand you would like personal assistance. I have forwarded your message to our human support team. You can continue typing here, and an HCPT specialist will review your message and reply directly.",
      shouldEscalate: true,
      escalationReason: escalation.reason
    };
  }

  // 2. Check if an AI provider is configured
  if (!isAiConfigured()) {
    return {
      text: "Thank you for reaching out to HCPT. Our AI automated service is currently in setup mode. I have routed your message to our human support desk so an HCPT team member can assist you directly.",
      shouldEscalate: true,
      escalationReason: 'AI provider unconfigured; automatic fallback to human support'
    };
  }

  // 3. Prepare recent message history (last 8 messages for context)
  const recentHistory = conversationHistory
    .filter(m => !m.isInternalNote)
    .slice(-8);

  try {
    // 3a. Try Google Gemini with the fastest reliable models first
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

      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-flash-latest'];
      for (const modelName of modelsToTry) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': GEMINI_API_KEY
              },
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: HCPT_SYSTEM_INSTRUCTION }]
                },
                contents,
                generationConfig: {
                  temperature: 0.4,
                  maxOutputTokens: 600
                }
              }),
              signal: AbortSignal.timeout(10000)
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
            console.warn(`[AI Service] Model ${modelName} returned HTTP ${res.status}:`, (await res.text()).substring(0, 150));
          }
        } catch (geminiErr: any) {
          console.warn(`[AI Service] Attempt with ${modelName} failed, trying next fallback:`, geminiErr?.message || geminiErr);
        }
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
