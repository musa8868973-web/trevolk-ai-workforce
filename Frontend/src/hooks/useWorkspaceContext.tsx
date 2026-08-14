import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface Workspace {
  id: string;
  name: string;
  industry: string;
  plan: "Starter" | "Growth" | "Enterprise";
}

const WORKSPACES: Workspace[] = [
  { id: "ws1", name: "Luxe Living", industry: "E-commerce", plan: "Growth" },
  { id: "ws2", name: "Northline Agency", industry: "Digital Agency", plan: "Starter" },
];

interface WorkspaceContextValue {
  workspaces: Workspace[];
  workspace: Workspace;
  setWorkspaceId: (id: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  user: { name: string; email: string; role: string };
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const STORAGE_KEY = "trevolk.sidebar.collapsed";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaceId, setWorkspaceId] = useState(WORKSPACES[0]!.id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setSidebarCollapsed(true);
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces: WORKSPACES,
      workspace: WORKSPACES.find((w) => w.id === workspaceId) ?? WORKSPACES[0]!,
      setWorkspaceId,
      sidebarCollapsed,
      toggleSidebar: () =>
        setSidebarCollapsed((prev) => {
          window.localStorage.setItem(STORAGE_KEY, String(!prev));
          return !prev;
        }),
      user: { name: "Ayesha Siddiqui", email: "ayesha@company.com", role: "Owner" },
    }),
    [workspaceId, sidebarCollapsed],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceContext must be used inside WorkspaceProvider");
  return ctx;
}
