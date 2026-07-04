// Builds prompts to send to the `ai` module. Kept separate so prompt engineering changes never
// touch conversation flow or intent detection.

export class PromptService {
  buildFaqAnswerPrompt(question: string, contextBlob: string): string {
    // TODO: refine once the ai module's summarizer/embeddings interfaces are implemented.
    return `Answer the question using only the provided context.\nContext: ${contextBlob}\nQuestion: ${question}`;
  }
}
