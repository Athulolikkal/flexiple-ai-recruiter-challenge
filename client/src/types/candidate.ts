export interface PastCompany {
  company: string;
  company_type: string;
  title: string;
  years: number;
}

export interface Candidate {
  id: string;
  name: string;
  current_title: string;
  years_experience: number;
  location: string;
  current_company: string;
  current_company_type: string;
  skills: string[];
  past_companies: PastCompany[];
  education: string;
  summary: string;
}

export interface RankedCandidate extends Candidate {
  score: number;
  explanation: string;
}

/** A recruiter's quick per-candidate verdict, the "Yes/No" shorthand for feedback. */
export type Verdict = 'yes' | 'no';
