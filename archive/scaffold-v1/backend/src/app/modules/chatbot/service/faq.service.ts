// TODO: wire to the real knowledge-base module/repository once implemented (NFR-1.1.4).
// This module must check the FAQ knowledge base before routing to ticket creation.

export class FaqService {
  async findAnswer(_question: string): Promise<string | null> {
    // TODO: call into modules/knowledge-base service; returning null (no match) for now,
    // which should trigger ticket-creation fallback.
    return null;
  }
}
