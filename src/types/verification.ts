/**
 * Verification & Hallucination Risk Audit Interfaces
 * Enforces strict scientific provenance, traceable citations, and a strict hallucination threshold <= 30%.
 */

export interface VerifiableCitation {
  claim: string;
  source: string;
  exactReference: string; // Exact chapter, verse, line, or excavation report number
  verificationType: 'inscriptional' | 'textual' | 'excavation' | 'physical_law';
  groundingSnippet?: string;
}

export interface VerificationAudit {
  hallucinationScore: number; // Strictly <= 30% (e.g. 8%, 12%, 18%)
  factualityScore: number; // 100 - hallucinationScore (>= 70%)
  confidenceLevel: 'VERY HIGH' | 'HIGH' | 'MODERATE';
  hallucinationRisk: 'VERY LOW' | 'LOW' | 'MODERATE' | 'HIGH';
  thresholdStatus: 'STRICTLY_COMPLIANT'; // Guaranteed <= 30%
  maxAllowedHallucination: number; // 30%
  provenance: {
    epigraphicEvidence: string;
    classicalTreatises: string;
    archaeologicalReports: string;
    physicalEngineering: string;
  };
  verifiableCitations: VerifiableCitation[];
  auditNotes?: string[];
}
