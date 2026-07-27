// The only entry point other modules should use. Wraps classifier/summarizer/embeddings so
// callers (chatbot, tickets) never import those submodules directly.

import { TicketClassifier } from '../classifier/ticket-classifier';
import { Summarizer } from '../summarizer/summarizer';
import { EmbeddingsService } from '../embeddings/embeddings';
import { ClassificationResult, SummaryResult, EmbeddingResult } from '../types/ai.types';

export class AiService {
  constructor(
    private readonly classifier: TicketClassifier = new TicketClassifier(),
    private readonly summarizer: Summarizer = new Summarizer(),
    private readonly embeddingsService: EmbeddingsService = new EmbeddingsService(),
  ) {}

  async classifyTicket(text: string): Promise<ClassificationResult> {
    return this.classifier.classify(text);
  }

  async summarize(text: string): Promise<SummaryResult> {
    return this.summarizer.summarize(text);
  }

  async embed(text: string): Promise<EmbeddingResult> {
    return this.embeddingsService.embed(text);
  }
}
