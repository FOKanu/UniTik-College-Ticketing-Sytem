export interface ClassificationResult {
  category: string;
  confidence: number;
}

export interface SummaryResult {
  summary: string;
}

export interface EmbeddingResult {
  vector: number[];
}
