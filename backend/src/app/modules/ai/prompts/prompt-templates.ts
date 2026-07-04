// Centralized prompt templates so wording changes don't ripple through classifier/summarizer code.
// TODO: refine templates once a model/provider is chosen.

export const PROMPT_TEMPLATES = {
  classifyTicket: (ticketText: string): string =>
    `Classify the following university support ticket into a category:\n\n${ticketText}`,
  summarizeThread: (thread: string): string => `Summarize the following support thread:\n\n${thread}`,
};
