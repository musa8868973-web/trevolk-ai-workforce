import type { ReactNode } from "react";
import { Outlet } from "@tanstack/react-router";
import { DesktopSidebar } from "@/components/navigation/DashboardSidebar";
import { TopBar } from "@/components/navigation/TopBar";
import { WorkspaceProvider } from "@/hooks/useWorkspaceContext";

export function DashboardLayout({ children }: { children?: ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen bg-background">
        <DesktopSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
