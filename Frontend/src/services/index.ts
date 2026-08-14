/**
 * Frontend API client layer.
 * Every screen reads through these services — never directly from the data modules —
 * so a real backend can be swapped in without touching calling code.
 */
import { AI_EMPLOYEES, EMPLOYEE_ORDER } from "./employees.data";
import {
  ACTIVITY_FEED,
  ALERTS,
  ANALYTICS_SERIES,
  APPOINTMENTS,
  AUTOMATIONS,
  CHANNEL_VOLUME,
  CONVERSATIONS,
  CUSTOMERS,
  INTEGRATIONS,
  KNOWLEDGE_ITEMS,
  LEADS,
  TEAM,
} from "./workspace.data";
import type { AIEmployeeConfig, EmployeeType } from "@/types";

const LATENCY = 260;

function respond<T>(payload: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(payload)), ms));
}

export const employeeService = {
  list: () => respond(EMPLOYEE_ORDER.map((t) => AI_EMPLOYEES[t])),
  get: (type: EmployeeType): Promise<AIEmployeeConfig> => respond(AI_EMPLOYEES[type]),
};

export const workspaceService = {
  alerts: () => respond(ALERTS),
  activity: () => respond(ACTIVITY_FEED),
  team: () => respond(TEAM),
};

export const conversationService = {
  list: () => respond(CONVERSATIONS),
};

export const leadService = {
  list: () => respond(LEADS),
};

export const customerService = {
  list: () => respond(CUSTOMERS),
};

export const appointmentService = {
  list: () => respond(APPOINTMENTS),
};

export const knowledgeService = {
  list: () => respond(KNOWLEDGE_ITEMS),
};

export const automationService = {
  list: () => respond(AUTOMATIONS),
};

export const integrationService = {
  list: () => respond(INTEGRATIONS),
};

export const analyticsService = {
  overview: () => respond({ series: ANALYTICS_SERIES, channels: CHANNEL_VOLUME }),
};
