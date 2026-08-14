/**
 * AI provider abstraction foundation (Phase 5A §9).
 *
 * The backend is designed to support multiple LLM providers behind one
 * interface (Backend Specification §2.7): OpenAI, Gemini, Claude, and
 * Groq. This file defines the shape a future provider adapter must
 * implement so the AI Agent Layer (Phase 5B+) can call any configured
 * provider without knowing its request/response format.
 *
 * Deliberately NOT implemented here:
 *   - No concrete provider adapters (OpenAI/Gemini/Claude/Groq clients).
 *   - No tool-calling / function-calling shapes.
 *   - No streaming.
 * Those are Phase 5B/5C+ concerns. This phase only establishes the
 * interface so later phases can add a provider without touching the AI
 * Employee domain model, service layer, or routes.
 */

/** Identifies which configured LLM provider an employee is using. Matches `appConfig.aiProviders` (see `config/app.config.ts`). */
export const AI_PROVIDER_NAMES = {
  OPENAI: 'OPENAI',
  GEMINI: 'GEMINI',
  CLAUDE: 'CLAUDE',
  GROQ: 'GROQ',
} as const;

export type AIProviderName = (typeof AI_PROVIDER_NAMES)[keyof typeof AI_PROVIDER_NAMES];

/** A single message in a provider-agnostic conversation history. */
export interface AIProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Provider-agnostic request shape a future AI Agent Layer would send to a provider adapter. */
export interface AIProviderCompletionRequest {
  model: string;
  messages: AIProviderMessage[];
  /** Non-secret, provider-agnostic generation parameters (e.g. temperature). Never includes credentials. */
  parameters?: Record<string, unknown>;
}

/** Provider-agnostic response shape every provider adapter normalizes its own format into. */
export interface AIProviderCompletionResult {
  content: string;
  /** Which provider actually served the request — useful for logging/auditability (Backend Specification §9). */
  provider: AIProviderName;
}

/**
 * The contract every provider adapter (OpenAI, Gemini, Claude, Groq) must
 * implement. No adapter is implemented in this phase — this interface
 * exists solely so Phase 5B+ can register one without changing anything
 * in `modules/ai-employees` outside this file and `provider.registry.ts`.
 */
export interface AIProvider {
  readonly name: AIProviderName;
  complete(request: AIProviderCompletionRequest): Promise<AIProviderCompletionResult>;
}
