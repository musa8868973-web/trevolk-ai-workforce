import { useQuery } from "@tanstack/react-query";
import {
  analyticsService,
  appointmentService,
  automationService,
  conversationService,
  customerService,
  employeeService,
  integrationService,
  knowledgeService,
  leadService,
  workspaceService,
} from "@/services";
import type { EmployeeType } from "@/types";

export const useEmployees = () => useQuery({ queryKey: ["employees"], queryFn: employeeService.list });
export const useEmployee = (type: EmployeeType) =>
  useQuery({ queryKey: ["employee", type], queryFn: () => employeeService.get(type) });
export const useAlerts = () => useQuery({ queryKey: ["alerts"], queryFn: workspaceService.alerts });
export const useActivityFeed = () => useQuery({ queryKey: ["activity"], queryFn: workspaceService.activity });
export const useTeam = () => useQuery({ queryKey: ["team"], queryFn: workspaceService.team });
export const useConversations = () => useQuery({ queryKey: ["conversations"], queryFn: conversationService.list });
export const useLeads = () => useQuery({ queryKey: ["leads"], queryFn: leadService.list });
export const useCustomers = () => useQuery({ queryKey: ["customers"], queryFn: customerService.list });
export const useAppointments = () => useQuery({ queryKey: ["appointments"], queryFn: appointmentService.list });
export const useKnowledgeItems = () => useQuery({ queryKey: ["knowledge"], queryFn: knowledgeService.list });
export const useAutomations = () => useQuery({ queryKey: ["automations"], queryFn: automationService.list });
export const useIntegrations = () => useQuery({ queryKey: ["integrations"], queryFn: integrationService.list });
export const useAnalytics = () => useQuery({ queryKey: ["analytics"], queryFn: analyticsService.overview });
