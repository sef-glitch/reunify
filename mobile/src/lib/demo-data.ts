// Demo data for new users to see how the app works
// This creates a sample case with tasks, documents, and evidence

export interface DemoCase {
  name: string;
  state: string;
  county: string;
  caseType: 'custody' | 'cps' | 'visitation' | 'modification' | 'other';
  stage: 'initial' | 'discovery' | 'mediation' | 'trial' | 'appeals' | 'closed';
  nextHearingDate: string | null;
  goals: string[];
}

export interface DemoTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string | null;
}

export interface DemoDocument {
  title: string;
  category: 'letter' | 'declaration' | 'log' | 'request' | 'other';
  content: string;
}

export interface DemoEvidence {
  title: string;
  type: 'photo' | 'document' | 'audio' | 'video' | 'other';
  uri: string;
  notes: string;
  tags: string[];
}

// Get a date relative to today
function getRelativeDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

export const DEMO_CASE: DemoCase = {
  name: 'Sample Custody Case',
  state: 'California',
  county: 'Los Angeles',
  caseType: 'custody',
  stage: 'discovery',
  nextHearingDate: getRelativeDate(45), // 45 days from now
  goals: [
    'Establish consistent visitation schedule',
    'Document communication patterns',
    'Prepare evidence for mediation',
  ],
};

export const DEMO_TASKS: DemoTask[] = [
  {
    title: 'Complete parenting questionnaire',
    description: 'Fill out the court-mandated parenting questionnaire form. Be thorough and honest in your responses.',
    priority: 'high',
    status: 'pending',
    dueDate: getRelativeDate(7),
  },
  {
    title: 'Gather school records',
    description: 'Request attendance records, report cards, and teacher communications from the past 2 years.',
    priority: 'medium',
    status: 'in_progress',
    dueDate: getRelativeDate(14),
  },
  {
    title: 'Document visitation log',
    description: 'Keep a detailed log of all visitations including times, activities, and any issues that arise.',
    priority: 'high',
    status: 'pending',
    dueDate: null,
  },
  {
    title: 'Review communication guidelines',
    description: 'Review the court-ordered communication guidelines and ensure compliance.',
    priority: 'low',
    status: 'completed',
    dueDate: getRelativeDate(-3),
  },
  {
    title: 'Schedule mediation appointment',
    description: 'Contact the family court services to schedule your mediation appointment.',
    priority: 'urgent',
    status: 'pending',
    dueDate: getRelativeDate(5),
  },
];

export const DEMO_DOCUMENTS: DemoDocument[] = [
  {
    title: 'Visitation Log Template',
    category: 'log',
    content: `VISITATION LOG

Child(ren): [Names]
Week of: [Date]

---

Date: [Enter Date]
Scheduled Time: [Start] - [End]
Actual Time: [Start] - [End]

Activities:
- [Describe activities during visit]

Child's Mood/Behavior:
- [Note any observations]

Communication with Other Parent:
- [Document any communication]

Issues or Concerns:
- [Note any problems that arose]

---

Notes:
[Additional observations or important details]

This log is maintained for documentation purposes and will be available for court review if needed.`,
  },
  {
    title: 'Request for School Records',
    category: 'request',
    content: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

[School Name]
Attn: Records Department
[School Address]
[City, State ZIP]

RE: Request for Student Records
Student: [Child's Name]
Grade: [Grade Level]

Dear Records Administrator,

Pursuant to the Family Educational Rights and Privacy Act (FERPA), I am requesting copies of the following educational records for my child, [Child's Name]:

1. Attendance records for the past two academic years
2. Report cards and progress reports
3. Standardized test scores
4. Teacher comments and evaluations
5. Disciplinary records, if any
6. Any Individualized Education Program (IEP) or 504 Plan documents

These records are needed in connection with a family court proceeding. Please provide copies within the timeframe required by FERPA (45 days).

If there are any fees associated with this request, please contact me in advance.

Thank you for your prompt attention to this matter.

Sincerely,

[Your Signature]
[Your Printed Name]
[Phone Number]
[Email Address]`,
  },
];

export const DEMO_EVIDENCE: DemoEvidence[] = [
  {
    title: 'Sample: Communication Screenshot',
    type: 'photo',
    uri: '',
    notes: 'Example of how to document text message communications. Replace this with your actual screenshots.',
    tags: ['communication', 'example'],
  },
  {
    title: 'Sample: Calendar Records',
    type: 'document',
    uri: '',
    notes: 'Example placeholder for calendar/schedule documentation. Upload your actual visitation calendars here.',
    tags: ['schedule', 'visitation', 'example'],
  },
];

export function isDemoCase(caseName: string): boolean {
  return caseName === DEMO_CASE.name;
}
