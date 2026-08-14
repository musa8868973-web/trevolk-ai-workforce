import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  Contact,
  Target,
  CalendarDays,
  BookOpen,
  Workflow,
  BarChart3,
  Plug,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkspaceContext } from "@/hooks/useWorkspaceContext";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const SIDEBAR_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "AI Employees", to: "/dashboard/ai-employees", icon: Users },
  { label: "Conversations", to: "/dashboard/conversations", icon: MessagesSquare },
  { label: "Customers", to: "/dashboard/customers", icon: Contact },
  { label: "Leads", to: "/dashboard/leads", icon: Target },
  { label: "Appointments", to: "/dashboard/appointments", icon: CalendarDays },
  { label: "Knowledge Base", to: "/dashboard/knowledge-base", icon: BookOpen },
  { label: "Automations", to: "/dashboard/automations", icon: Workflow },
  { label: "Analytics", to: "/dashboard/analytics", icon: BarChart3 },
  { label: "Integrations", to: "/dashboard/integrations", icon: Plug },
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
];

export function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <TooltipProvider delayDuration={120}>
      <nav aria-label="Dashboard" className="flex flex-col gap-1 px-3">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const link = (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-body font-medium text-sidebar-foreground/80 transition-all duration-150",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0",
              )}
              activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground",
                "data-active": "true",
              }}
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <Icon className={cn("size-4.5 shrink-0", isActive && "text-primary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>
    </TooltipProvider>
  );
}

export function DesktopSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useWorkspaceContext();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
        sidebarCollapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", sidebarCollapsed && "justify-center px-0")}>
        <Logo showWord={!sidebarCollapsed} />
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav collapsed={sidebarCollapsed} />
      </div>
      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-caption font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            sidebarCollapsed && "justify-center px-0",
          )}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
          {!sidebarCollapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
