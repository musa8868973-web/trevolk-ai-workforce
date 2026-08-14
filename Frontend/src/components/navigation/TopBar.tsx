import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Check, ChevronsUpDown, Menu, Search } from "lucide-react";
import { Logo } from "./Logo";
import { SidebarNav, SIDEBAR_ITEMS } from "./DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWorkspaceContext } from "@/hooks/useWorkspaceContext";
import { useAlerts } from "@/hooks/useTrevolkData";
import { ToneBadge } from "@/components/ui/StatusBadge";

export function TopBar() {
  const { workspace, workspaces, setWorkspaceId, user } = useWorkspaceContext();
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const { data: alerts } = useAlerts();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:px-6">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-16 items-center border-b border-sidebar-border px-4">
            <Logo />
          </div>
          <div className="py-4">
            <SidebarNav collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-caption font-medium transition-colors hover:bg-elevated">
            <span className="flex size-5 items-center justify-center rounded bg-primary/15 text-[10px] font-bold text-primary">
              {workspace.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="max-w-[10rem] truncate">{workspace.name}</span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((ws) => (
            <DropdownMenuItem key={ws.id} onSelect={() => setWorkspaceId(ws.id)} className="justify-between">
              <span className="truncate">
                {ws.name}
                <span className="ml-2 text-caption text-muted-foreground">{ws.plan}</span>
              </span>
              {ws.id === workspace.id && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate({ to: "/workspace-setup" })}>
            Create a workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-elevated md:ml-0 md:w-72 md:justify-start md:gap-2 md:px-3"
        aria-label="Search"
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="hidden text-caption md:inline">Search everything…</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-5" />
              {alerts && alerts.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger" aria-hidden="true" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b border-border px-4 py-3">
              <p className="text-h3">Notifications</p>
              <p className="text-caption text-muted-foreground">{alerts?.length ?? 0} need attention</p>
            </div>
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {(alerts ?? []).map((a) => (
                <li key={a.id}>
                  <Link to={a.href} className="block px-4 py-3 transition-colors hover:bg-elevated">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-body font-medium">{a.title}</p>
                      <ToneBadge tone={a.severity === "danger" ? "danger" : "warning"}>
                        {a.severity === "danger" ? "Critical" : "Warning"}
                      </ToneBadge>
                    </div>
                    <p className="mt-1 text-caption text-muted-foreground">{a.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-caption font-semibold transition-colors hover:bg-elevated"
              aria-label="Account menu"
            >
              {user.name.split(" ").map((n) => n[0]).join("")}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-body font-medium">{user.name}</p>
              <p className="text-caption font-normal text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/dashboard/settings" })}>Workspace settings</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/pricing" })}>Plans & billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/login" })}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search pages, employees, conversations…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Go to">
            {SIDEBAR_ITEMS.map((item) => (
              <CommandItem
                key={item.to}
                value={item.label}
                onSelect={() => {
                  setCommandOpen(false);
                  navigate({ to: item.to });
                }}
              >
                <item.icon className="mr-2 size-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
