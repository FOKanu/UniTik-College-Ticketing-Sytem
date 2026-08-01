// TODO: implement real summarization (e.g. for long ticket threads or escalation handoff notes).

import { SummaryResult } from '../types/ai.types';

export class Summarizer {
  async summarize(_text: string): Promise<SummaryResult> {
    return { summary: 'TODO: real summarization not yet implemented.' };
  }
}
