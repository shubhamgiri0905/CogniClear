export enum DecisionStatus {
  DRAFT = 'DRAFT',
  ANALYZED = 'ANALYZED',
  COMPLETED = 'COMPLETED'
}

export enum Emotion {
  ANXIOUS = 'Anxious',
  EXCITED = 'Excited',
  CONFUSED = 'Confused',
  CONFIDENT = 'Confident',
  PRESSURE = 'Pressure',
  NEUTRAL = 'Neutral'
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface BiasAnalysis {
  name: string;
  description: string;
  probability: number; // 0-100
  mitigation: string;
}

export interface SimulationResult {
  scenario: string;
  outcome: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface DecisionAnalysis {
  summary: string;
  biases: BiasAnalysis[];
  blindSpots: string[];
  alternativePerspectives: string[];
  simulations: SimulationResult[];
  clarityScore: number; // 0-100
  relatedTags: string[];
}

export interface OutcomeAnalysis {
  causalReflection: string;
  biasValidation: string;
  learningPoint: string;
  updatedClarityScore: number;
}

export interface Decision {
  id: string;
  userId: string; // Foreign Key to User
  title: string;
  description: string;
  context: string;
  optionsConsidered: string[];
  emotions: Emotion[]; 
  dateCreated: string;
  status: DecisionStatus;
  analysis?: DecisionAnalysis;
  outcome?: string; 
  outcomeDate?: string;
  outcomeAnalysis?: OutcomeAnalysis;
  tags: string[];
}

export type RootStackParamList = {
  Dashboard: undefined;
  DecisionLog: undefined;
  NewDecision: undefined;
  DecisionDetail: { id: string };
};