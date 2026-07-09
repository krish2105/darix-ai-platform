export interface Question {
  id: string;
  text: string;
  dimensionId: string;
}

export interface Dimension {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export const dimensions: Dimension[] = [
  {
    id: 'strategy',
    title: 'AI Strategy',
    description: 'Alignment of AI initiatives with business goals.',
    questions: [
      { id: 'q1', text: 'Does your organization have a documented AI strategy?', dimensionId: 'strategy' },
      { id: 'q2', text: 'Have you identified specific AI use cases?', dimensionId: 'strategy' },
      { id: 'q3', text: 'Do senior leaders understand AI’s business value?', dimensionId: 'strategy' },
    ],
  },
  {
    id: 'data',
    title: 'Data Maturity',
    description: 'Quality, accessibility, and governance of business data.',
    questions: [
      { id: 'q4', text: 'Is your business data centralized and accessible?', dimensionId: 'data' },
      { id: 'q5', text: 'Do you have clean historical data for analysis?', dimensionId: 'data' },
      { id: 'q6', text: 'Are data ownership and quality standards defined?', dimensionId: 'data' },
    ],
  },
  {
    id: 'tech',
    title: 'Technology Infrastructure',
    description: 'Systems and platforms supporting AI capabilities.',
    questions: [
      { id: 'q7', text: 'Do your systems integrate through APIs?', dimensionId: 'tech' },
      { id: 'q8', text: 'Are cloud platforms or scalable infrastructure available?', dimensionId: 'tech' },
      { id: 'q9', text: 'Can your current systems support analytics and automation?', dimensionId: 'tech' },
    ],
  },
  {
    id: 'process',
    title: 'Process Automation',
    description: 'Readiness of workflows for AI-driven automation.',
    questions: [
      { id: 'q10', text: 'Are repetitive workflows documented?', dimensionId: 'process' },
      { id: 'q11', text: 'Are there manual tasks suitable for automation?', dimensionId: 'process' },
      { id: 'q12', text: 'Do teams use digital workflow tools?', dimensionId: 'process' },
    ],
  },
  {
    id: 'people',
    title: 'People & Skills',
    description: 'Team capabilities and readiness for AI adoption.',
    questions: [
      { id: 'q13', text: 'Do employees understand AI basics?', dimensionId: 'people' },
      { id: 'q14', text: 'Are there analytics or technical skills in the organization?', dimensionId: 'people' },
      { id: 'q15', text: 'Is leadership willing to invest in AI training?', dimensionId: 'people' },
    ],
  },
  {
    id: 'governance',
    title: 'AI Governance',
    description: 'Policies and frameworks for responsible AI use.',
    questions: [
      { id: 'q16', text: 'Are data privacy policies clear?', dimensionId: 'governance' },
      { id: 'q17', text: 'Are AI risks reviewed before implementation?', dimensionId: 'governance' },
      { id: 'q18', text: 'Is there a responsible AI or compliance process?', dimensionId: 'governance' },
    ],
  },
  {
    id: 'usecases',
    title: 'Use Case Potential',
    description: 'Identification of high-impact applications.',
    questions: [
      { id: 'q19', text: 'Are there processes that can significantly benefit from AI?', dimensionId: 'usecases' },
      { id: 'q20', text: 'Are there decision-making processes that need better prediction?', dimensionId: 'usecases' },
      { id: 'q21', text: 'Are there high-volume repetitive tasks in operations?', dimensionId: 'usecases' },
    ],
  },
  {
    id: 'roi',
    title: 'ROI & Business Value',
    description: 'Measurement of business impact and returns.',
    questions: [
      { id: 'q22', text: 'Can AI impact revenue, cost, speed, quality, or customer experience?', dimensionId: 'roi' },
      { id: 'q23', text: 'Are business KPIs clearly measured?', dimensionId: 'roi' },
      { id: 'q24', text: 'Can teams track the success of AI projects?', dimensionId: 'roi' },
    ],
  },
];
