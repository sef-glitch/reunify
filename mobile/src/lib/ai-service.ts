/**
 * AI Service for Reunify
 * Provides AI-powered assistance via Anthropic's Claude API.
 */

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// Types
export interface CaseIntake {
  name: string;
  state: string;
  county: string;
  caseType: 'custody' | 'cps' | 'visitation' | 'modification' | 'other';
  stage: 'initial' | 'discovery' | 'mediation' | 'trial' | 'appeals' | 'closed';
  nextHearingDate: string | null;
  goals: string[];
  additionalContext?: string;
}

export interface PlanTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  suggestedDeadline: string | null;
  category: 'documentation' | 'evidence' | 'communication' | 'preparation' | 'legal' | 'other';
}

export interface EvidenceToGather {
  type: string;
  description: string;
  importance: 'essential' | 'recommended' | 'helpful';
  tips: string[];
}

export interface ActionPlan {
  id: string;
  summary: string;
  tasks: PlanTask[];
  evidenceToGather: EvidenceToGather[];
  keyDates: Array<{ date: string; description: string }>;
  disclaimer: string;
  createdAt: string;
}

export interface DocumentDraft {
  id: string;
  title: string;
  category: 'letter' | 'declaration' | 'log' | 'request' | 'other';
  content: string;
  disclaimer: string;
  createdAt: string;
}

export interface Explanation {
  term: string;
  plainLanguageExplanation: string;
  keyPoints: string[];
  questionsToAsk: string[];
  whatToVerify: string[];
  disclaimer: string;
}

export interface CaseAnalysis {
  id: string;
  overallAssessment: string;
  strengths: string[];
  areasToImprove: string[];
  riskFactors: string[];
  nextStepsRecommendation: string;
  stageSpecificAdvice: string;
  disclaimer: string;
  createdAt: string;
}

export interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  reasoning: string;
}

export interface TaskSuggestionsResult {
  id: string;
  suggestions: TaskSuggestion[];
  contextSummary: string;
  disclaimer: string;
  createdAt: string;
}

// Helper to call AI via backend proxy
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ systemPrompt, userPrompt }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('AI API error:', errorData);
    throw new Error((errorData as any)?.error || 'Failed to get AI response. Please try again.');
  }

  const data = await response.json() as { content: string; stopReason?: string };

  if (!data.content) {
    console.error('Empty response from AI');
    throw new Error('AI returned an empty response. Please try again.');
  }

  if (data.stopReason === 'max_tokens') {
    console.warn('AI response was truncated due to length limit');
  }

  return data.content;
}

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Extract JSON from response (handles markdown code blocks)
function extractJSON(response: string): string {
  if (!response || response.trim() === '') {
    throw new Error('Empty response from AI');
  }

  let jsonStr = response.trim();

  // Try to extract from markdown code blocks first
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Try to find JSON object boundaries if not in code block
  if (!jsonStr.startsWith('{')) {
    const startIndex = jsonStr.indexOf('{');
    if (startIndex !== -1) {
      jsonStr = jsonStr.substring(startIndex);
    }
  }

  // Find the last closing brace
  const lastBrace = jsonStr.lastIndexOf('}');
  if (lastBrace !== -1 && lastBrace < jsonStr.length - 1) {
    jsonStr = jsonStr.substring(0, lastBrace + 1);
  }

  return jsonStr;
}

const DISCLAIMER = `
IMPORTANT DISCLAIMER: This information is provided for general guidance only and does NOT constitute legal advice.
Every case is unique, and laws vary by state and jurisdiction.
You should:
- Verify all information with official court resources or your state's family law statutes
- Consult with a licensed attorney or legal aid organization in your area
- Never rely solely on AI-generated guidance for legal decisions
`.trim();

/**
 * Generates an action plan based on case intake and goals
 */
export async function generateActionPlan(intake: CaseIntake): Promise<ActionPlan> {
  const systemPrompt = `You are a helpful assistant providing organizational guidance for parents navigating family court or CPS proceedings. You provide practical, actionable task lists and evidence-gathering suggestions.

CRITICAL RULES:
1. NEVER provide specific legal advice or make definitive legal claims
2. ALWAYS recommend verifying information with official state resources or legal counsel
3. Focus on organizational tasks, evidence gathering, and preparation
4. Be empathetic but professional
5. Respond ONLY with valid JSON matching the specified format

Output JSON format:
{
  "summary": "Brief overview of the recommended approach",
  "tasks": [
    {
      "title": "Task name",
      "description": "Detailed description",
      "priority": "low|medium|high|urgent",
      "suggestedDeadline": "ISO date or null if no specific deadline",
      "category": "documentation|evidence|communication|preparation|legal|other"
    }
  ],
  "evidenceToGather": [
    {
      "type": "Type of evidence",
      "description": "What to gather",
      "importance": "essential|recommended|helpful",
      "tips": ["Tip 1", "Tip 2"]
    }
  ],
  "keyDates": [
    {"date": "ISO date", "description": "What this date is for"}
  ]
}`;

  const userPrompt = `Please create an action plan for the following case:

Case Type: ${intake.caseType}
Stage: ${intake.stage}
State: ${intake.state}
County: ${intake.county}
${intake.nextHearingDate ? `Next Hearing: ${intake.nextHearingDate}` : 'No hearing date set'}

Goals:
${intake.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

${intake.additionalContext ? `Additional Context: ${intake.additionalContext}` : ''}

Create a practical action plan with prioritized tasks and evidence to gather. Focus on what the parent can do to organize and prepare their case.`;

  const response = await callAI(systemPrompt, userPrompt);

  try {
    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);

    return {
      id: generateId(),
      summary: parsed.summary || 'Action plan generated successfully.',
      tasks: (parsed.tasks || []).map((t: PlanTask) => ({
        title: t.title,
        description: t.description,
        priority: t.priority || 'medium',
        suggestedDeadline: t.suggestedDeadline || null,
        category: t.category || 'other',
      })),
      evidenceToGather: parsed.evidenceToGather || [],
      keyDates: parsed.keyDates || [],
      disclaimer: DISCLAIMER,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', response.substring(0, 500));
    throw new Error('Failed to generate action plan. Please try again.');
  }
}

/**
 * Generates a document draft based on type, case context, and user notes
 */
export async function generateDocumentDraft(
  documentType: 'letter' | 'declaration' | 'log' | 'request' | 'other',
  caseContext: {
    caseType: string;
    stage: string;
    state: string;
    county: string;
    goals: string[];
  },
  userNotes: string,
  documentTitle?: string
): Promise<DocumentDraft> {
  const typeDescriptions: Record<string, string> = {
    letter: 'a formal letter (e.g., to court, agency, or attorney)',
    declaration: 'a declaration or sworn statement of facts',
    log: 'a structured log or journal entry for documentation purposes',
    request: 'a formal request (e.g., for records, visitation modification)',
    other: 'a general document',
  };

  const systemPrompt = `You are a helpful assistant drafting documents for parents navigating family court or CPS proceedings. Your documents should be:
- Professional and neutral in tone
- Clear and well-organized
- Factual and objective (avoid emotional language)
- Properly formatted for the document type

CRITICAL RULES:
1. Write in a neutral, professional tone
2. Focus on facts, not accusations or emotional appeals
3. Use clear, simple language
4. Include placeholders [IN BRACKETS] for specific details the user needs to fill in
5. NEVER include false information or make claims you cannot verify
6. Include a note at the end reminding the user to verify and customize the document

Respond with ONLY the document content, properly formatted. Do not include JSON or code blocks.`;

  const userPrompt = `Please draft ${typeDescriptions[documentType] || 'a document'} with the following context:

Case Type: ${caseContext.caseType}
Stage: ${caseContext.stage}
State: ${caseContext.state}
County: ${caseContext.county}

Goals:
${caseContext.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

User's Notes/Instructions:
${userNotes}

${documentTitle ? `Suggested Title: ${documentTitle}` : ''}

Please draft this document in a professional, neutral tone. Include [BRACKETED PLACEHOLDERS] for any specific information the user needs to fill in (dates, names, specific details, etc.).`;

  const content = await callAI(systemPrompt, userPrompt);

  const contentWithDisclaimer = `${content}

---

${DISCLAIMER}`;

  return {
    id: generateId(),
    title: documentTitle || `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Draft`,
    category: documentType,
    content: contentWithDisclaimer,
    disclaimer: DISCLAIMER,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Explains a legal term or court letter excerpt in plain language
 */
export async function explainTerm(termOrExcerpt: string): Promise<Explanation> {
  const systemPrompt = `You are a helpful assistant explaining legal terms and court documents to parents navigating family court or CPS proceedings. Your explanations should be:
- In plain, easy-to-understand language
- Accurate but not definitive (laws vary by jurisdiction)
- Helpful for understanding, not for making legal decisions

CRITICAL RULES:
1. NEVER provide specific legal advice
2. ALWAYS recommend verifying with official sources or legal counsel
3. Acknowledge that laws and procedures vary by state/jurisdiction
4. Be clear about what you're uncertain about

Respond ONLY with valid JSON in this format:
{
  "plainLanguageExplanation": "Clear explanation in simple terms",
  "keyPoints": ["Important point 1", "Important point 2"],
  "questionsToAsk": ["Question to ask your lawyer/advocate 1", "Question 2"],
  "whatToVerify": ["Thing to verify in official sources 1", "Thing 2"]
}`;

  const userPrompt = `Please explain the following legal term or court document excerpt in plain language:

"${termOrExcerpt}"

Provide:
1. A plain-language explanation
2. Key points to understand
3. Questions to ask a lawyer or advocate
4. Things to verify in official sources`;

  const response = await callAI(systemPrompt, userPrompt);

  try {
    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);

    return {
      term: termOrExcerpt,
      plainLanguageExplanation: parsed.plainLanguageExplanation || 'Unable to generate explanation.',
      keyPoints: parsed.keyPoints || [],
      questionsToAsk: parsed.questionsToAsk || [],
      whatToVerify: parsed.whatToVerify || [],
      disclaimer: DISCLAIMER,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', response.substring(0, 500));
    throw new Error('Failed to generate explanation. Please try again.');
  }
}

/**
 * Analyzes a case and provides strategic assessment
 */
export async function analyzeCase(intake: CaseIntake, existingTaskCount: number, existingDocCount: number, existingEvidenceCount: number): Promise<CaseAnalysis> {
  const systemPrompt = `You are a helpful assistant analyzing family court and CPS cases for organizational readiness. You provide a strategic assessment of case preparation, NOT legal predictions or outcome guarantees.

CRITICAL RULES:
1. NEVER predict case outcomes or make legal guarantees
2. Focus on organizational readiness and preparation gaps
3. Be encouraging but honest about areas that need work
4. Recommend specific, actionable improvements
5. Respond ONLY with valid JSON

Output JSON format:
{
  "overallAssessment": "2-3 sentence overview of case preparation status",
  "strengths": ["Strength 1", "Strength 2"],
  "areasToImprove": ["Area 1", "Area 2"],
  "riskFactors": ["Risk factor to be aware of 1", "Risk 2"],
  "nextStepsRecommendation": "Clear recommendation of what to focus on next",
  "stageSpecificAdvice": "Advice specific to the current case stage"
}`;

  const userPrompt = `Please analyze the following case for organizational readiness:

Case Name: ${intake.name}
Case Type: ${intake.caseType}
Stage: ${intake.stage}
State: ${intake.state}
County: ${intake.county}
${intake.nextHearingDate ? `Next Hearing: ${intake.nextHearingDate}` : 'No hearing date set'}

Goals:
${intake.goals.length > 0 ? intake.goals.map((g, i) => `${i + 1}. ${g}`).join('\n') : 'No goals specified yet'}

${intake.additionalContext ? `Additional Context: ${intake.additionalContext}` : ''}

Current Preparation Status:
- Tasks created: ${existingTaskCount}
- Documents prepared: ${existingDocCount}
- Evidence items: ${existingEvidenceCount}

Please provide an honest assessment of the case preparation, identify strengths and areas for improvement, and give stage-specific advice.`;

  const response = await callAI(systemPrompt, userPrompt);

  try {
    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);

    return {
      id: generateId(),
      overallAssessment: parsed.overallAssessment || 'Analysis complete.',
      strengths: parsed.strengths || [],
      areasToImprove: parsed.areasToImprove || [],
      riskFactors: parsed.riskFactors || [],
      nextStepsRecommendation: parsed.nextStepsRecommendation || '',
      stageSpecificAdvice: parsed.stageSpecificAdvice || '',
      disclaimer: DISCLAIMER,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', response.substring(0, 500));
    throw new Error('Failed to analyze case. Please try again.');
  }
}

/**
 * Suggests tasks based on the case context and existing tasks
 */
export async function suggestTasks(
  intake: CaseIntake,
  existingTasks: Array<{ title: string; status: string; priority: string }>,
): Promise<TaskSuggestionsResult> {
  const systemPrompt = `You are a helpful assistant that suggests organizational tasks for parents navigating family court or CPS proceedings. Your suggestions should fill gaps in their current task list and be practical, specific, and actionable.

CRITICAL RULES:
1. NEVER suggest tasks that constitute legal advice (e.g., "File a motion" — instead: "Consult with attorney about filing a motion")
2. Focus on preparation, documentation, organization, and communication tasks
3. Avoid duplicating existing tasks
4. Prioritize based on urgency and case stage
5. Respond ONLY with valid JSON

Output JSON format:
{
  "contextSummary": "Brief summary of what gaps you identified",
  "suggestions": [
    {
      "title": "Task title",
      "description": "Detailed actionable description",
      "priority": "low|medium|high|urgent",
      "category": "documentation|evidence|communication|preparation|legal|other",
      "reasoning": "Why this task is recommended"
    }
  ]
}`;

  const existingTasksSummary = existingTasks.length > 0
    ? existingTasks.map((t) => `- [${t.status}] (${t.priority}) ${t.title}`).join('\n')
    : 'No tasks created yet';

  const userPrompt = `Please suggest new tasks for the following case:

Case Type: ${intake.caseType}
Stage: ${intake.stage}
State: ${intake.state}
County: ${intake.county}
${intake.nextHearingDate ? `Next Hearing: ${intake.nextHearingDate}` : 'No hearing date set'}

Goals:
${intake.goals.length > 0 ? intake.goals.map((g, i) => `${i + 1}. ${g}`).join('\n') : 'No goals specified yet'}

Existing Tasks:
${existingTasksSummary}

Suggest 4-6 NEW tasks that would help this parent prepare their case. Focus on gaps in their current task list. Do NOT duplicate existing tasks.`;

  const response = await callAI(systemPrompt, userPrompt);

  try {
    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);

    return {
      id: generateId(),
      contextSummary: parsed.contextSummary || 'Task suggestions generated.',
      suggestions: (parsed.suggestions || []).map((s: TaskSuggestion) => ({
        title: s.title,
        description: s.description,
        priority: s.priority || 'medium',
        category: s.category || 'other',
        reasoning: s.reasoning || '',
      })),
      disclaimer: DISCLAIMER,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', response.substring(0, 500));
    throw new Error('Failed to generate task suggestions. Please try again.');
  }
}

/**
 * Check if AI service is available
 * Returns true only when a real backend URL is configured (not the default localhost placeholder)
 */
export function isAIServiceAvailable(): boolean {
  // Only available if backend URL is configured to something other than the default
  // The mobile app should set EXPO_PUBLIC_VIBECODE_BACKEND_URL to a real URL
  return !!BACKEND_URL && BACKEND_URL !== 'http://localhost:3000';
}
