// TODO: implement real ticket topic/category classification (NFR-1.3). Placeholder always
// returns a low-confidence "GENERAL" category so callers can distinguish mock output from a
// real classifier decision once implemented.

import { ClassificationResult } from '../types/ai.types';

export class TicketClassifier {
  async classify(_text: string): Promise<ClassificationResult> {
    return { category: 'GENERAL', confidence: 0 };
  }
}
