import type { AIEmployeeType } from '../constants';
import type { AIEmployeeConfiguration } from '../types/ai-employee-configuration.types';

/**
 * Conceptual execution foundation (Phase 5A §10):
 *
 *   User Request → AI Employee → Configuration → AI Provider → Response
 *
 * This file defines the *shape* of that flow so Phase 5B/5C can build the
 * real conversation engine against a stable contract. Deliberately NOT
 * implemented here:
 *   - No conversation memory/history assembly.
 *   - No knowledge base retrieval / RAG.
 *   - No tool calling.
 *   - No business-rule enforcement.
 * (Phase 5A §10, §21 — those are later phases.)
 */

/** Everything the (future) execution engine needs to run one AI Employee turn. */
export interface AIEmployeeExecutionContext {
  workspaceId: string;
  aiEmployeeId: string;
  employeeType: AIEmployeeType;
  configuration: AIEmployeeConfiguration;
  /** The triggering input for this turn (e.g. an inbound customer message). Kept as a plain string at this phase — richer input (attachments, structured events) is a later-phase concern. */
  input: string;
}

/** The structured result the execution engine would hand back to the Business Logic Layer (Backend Specification §3, §7). */
export interface AIEmployeeExecutionResult {
  output: string;
  aiEmployeeId: string;
}

/**
 * The contract a future concrete engine implements. No implementation is
 * provided in this phase; `NotImplementedAIEmployeeEngine` below exists
 * only so the interface is exercised/typechecked and future phases have
 * an obvious place to plug in real logic.
 */
export interface AIEmployeeEngine {
  execute(context: AIEmployeeExecutionContext): Promise<AIEmployeeExecutionResult>;
}

/**
 * Placeholder engine. Intentionally throws — executing an AI Employee
 * (assembling context, calling a provider, applying business rules) is
 * out of scope for Phase 5A (§10, §21). This class exists solely to prove
 * the `AIEmployeeEngine` contract is implementable and to give Phase 5B a
 * concrete starting point.
 */
export class NotImplementedAIEmployeeEngine implements AIEmployeeEngine {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_context: AIEmployeeExecutionContext): Promise<AIEmployeeExecutionResult> {
    throw new Error(
      'AI Employee execution is not implemented in Phase 5A — this is architecture-only scaffolding for a later phase.',
    );
  }
}
