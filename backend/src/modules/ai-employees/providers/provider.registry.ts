import type { AIProvider, AIProviderName } from './ai-provider.types';

/**
 * Minimal registry mapping a provider name to its adapter implementation
 * (Phase 5A §9). Empty by default in this phase — no concrete provider
 * (OpenAI/Gemini/Claude/Groq) is registered yet, since implementing those
 * adapters is explicitly out of scope (Phase 5A §9, §21 "DO NOT IMPLEMENT
 * PHASE 5B").
 *
 * A future phase registers a provider with:
 *   registerAIProvider(new OpenAIProvider());
 * and the AI Agent Layer resolves one with `getAIProvider(name)` without
 * any other part of this module needing to change.
 */
const registeredProviders = new Map<AIProviderName, AIProvider>();

export function registerAIProvider(provider: AIProvider): void {
  registeredProviders.set(provider.name, provider);
}

export function getAIProvider(name: AIProviderName): AIProvider | undefined {
  return registeredProviders.get(name);
}

export function listRegisteredAIProviders(): AIProviderName[] {
  return [...registeredProviders.keys()];
}
