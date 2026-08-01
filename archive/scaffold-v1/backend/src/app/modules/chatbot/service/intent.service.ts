// TODO: delegate real intent classification + language detection to the `ai` module
// (see modules/ai/classifier) once a model/provider is chosen. NFR-2.7.1, NFR-1.3.

export type Intent = 'FAQ_QUESTION' | 'TICKET_REQUEST' | 'UNKNOWN';

export class IntentService {
  async detectLanguage(_text: string): Promise<'en' | 'de'> {
    // TODO: replace with real detection; defaulting to English.
    return 'en';
  }

  async classifyIntent(_text: string): Promise<Intent> {
    // TODO: replace with a call into the ai module's classifier.
    return 'UNKNOWN';
  }
}
