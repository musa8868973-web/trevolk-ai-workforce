import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Check,
  Info,
  RotateCcw,
  Send,
  User,
  UserCog,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useConversations } from "@/hooks/useTrevolkData";
import type { Channel, Conversation, ConversationStatus, EmployeeType, Message } from "@/types";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/States";
import { CHANNEL_ICONS, CHANNEL_LABELS } from "./channel-utils";
import { EmployeeAvatar, EMPLOYEE_LABELS } from "@/components/ui/EmployeeAvatar";
import { ToneBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { TEAM } from "@/services/workspace.data";

const STATUS_TONE: Record<ConversationStatus, "info" | "danger" | "success"> = {
  open: "info",
  escalated: "danger",
  resolved: "success",
};

type MobileView = "list" | "conversation" | "context";

export function ConversationsView() {
  const { data, isLoading, isError, refetch } = useConversations();
  const [convos, setConvos] = useState<Conversation[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all");
  const [employeeFilter, setEmployeeFilter] = useState<EmployeeType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | "all">("all");
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [contextOpen, setContextOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);

  const list = convos ?? data ?? [];

  const filtered = useMemo(() => {
    return list.filter((c) => {
      if (channelFilter !== "all" && c.channel !== channelFilter) return false;
      if (employeeFilter !== "all" && c.employee !== employeeFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      return true;
    });
  }, [list, channelFilter, employeeFilter, statusFilter]);

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  function ensureConvos(): Conversation[] {
    if (convos) return convos;
    const base = data ? structuredClone(data) : [];
    setConvos(base);
    return base;
  }

  function updateConversation(id: string, updater: (c: Conversation) => Conversation) {
    const base = ensureConvos();
    const next = base.map((c) => (c.id === id ? updater(structuredClone(c)) : c));
    setConvos(next);
  }

  function clearFilters() {
    setChannelFilter("all");
    setEmployeeFilter("all");
    setStatusFilter("all");
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setMobileView("conversation");
  }

  function sendMessage(convoId: string) {
    const body = draft.trim();
    if (!body) return;
    const messageId = `m-${Date.now()}`;
    const optimistic: Message = {
      id: messageId,
      author: "human",
      authorName: "You",
      body,
      timestamp: "Just now",
      pending: true,
    };
    updateConversation(convoId, (c) => ({
      ...c,
      messages: [...c.messages, optimistic],
      preview: body,
      updatedAt: "Just now",
    }));
    setDraft("");
    setTyping(true);

    const willFail = Math.random() < 0.2;
    setTimeout(() => {
      setTyping(false);
      updateConversation(convoId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === messageId ? { ...m, pending: false, failed: willFail } : m,
        ),
      }));
      if (willFail) {
        toast.error("Message failed to send");
      } else {
        toast.success("Reply sent");
      }
    }, 1100);
  }

  function retryMessage(convoId: string, messageId: string) {
    updateConversation(convoId, (c) => ({
      ...c,
      messages: c.messages.map((m) => (m.id === messageId ? { ...m, pending: true, failed: false } : m)),
    }));
    setTimeout(() => {
      updateConversation(convoId, (c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === messageId ? { ...m, pending: false, failed: false } : m)),
      }));
      toast.success("Reply sent");
    }, 900);
  }

  function escalateTo(convoId: string, assignee: string) {
    updateConversation(convoId, (c) => ({ ...c, status: "escalated", handledBy: "human" }));
    setAssigneeOpen(false);
    toast.success(`Escalated to ${assignee}`);
  }

  const hasActiveFilters = channelFilter !== "all" || employeeFilter !== "all" || statusFilter !== "all";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Conversations" description="Every customer conversation across channels, in one inbox." />
        <SectionCard>
          <TableSkeleton rows={8} />
        </SectionCard>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Conversations" description="Every customer conversation across channels, in one inbox." />
        <SectionCard>
          <ErrorState onRetry={() => refetch()} />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <PageHeader title="Conversations" description="Every customer conversation across channels, in one unified inbox." />

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Channel"
          value={channelFilter}
          onChange={(v) => setChannelFilter(v as Channel | "all")}
          options={[
            { value: "all", label: "All channels" },
            ...Object.entries(CHANNEL_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <FilterSelect
          label="Employee"
          value={employeeFilter}
          onChange={(v) => setEmployeeFilter(v as EmployeeType | "all")}
          options={[
            { value: "all", label: "All employees" },
            ...Object.entries(EMPLOYEE_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as ConversationStatus | "all")}
          options={[
            { value: "all", label: "All statuses" },
            { value: "open", label: "Open" },
            { value: "escalated", label: "Escalated" },
            { value: "resolved", label: "Resolved" },
          ]}
        />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Info}
            title="No conversations match your filters"
            description="Try a different channel, employee or status."
            action={
              <Button onClick={clearFilters} variant="outline">
                Clear filters
              </Button>
            }
          />
        </SectionCard>
      ) : (
        <div className="surface-panel grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[320px_1fr_320px]">
          {/* List panel */}
          <div className={cn("min-h-0 flex-col border-border lg:flex lg:border-r", mobileView === "list" ? "flex" : "hidden")}>
            <ConversationList items={filtered} selectedId={selected?.id} onSelect={handleSelect} />
          </div>

          {/* Conversation panel */}
          <div className={cn("min-h-0 flex-col lg:flex lg:border-r lg:border-border", mobileView === "conversation" ? "flex" : "hidden")}>
            {selected ? (
              <ConversationThread
                conversation={selected}
                draft={draft}
                setDraft={setDraft}
                typing={typing}
                onBack={() => setMobileView("list")}
                onSend={() => sendMessage(selected.id)}
                onRetry={(mid) => retryMessage(selected.id, mid)}
                onEscalate={() => setAssigneeOpen(true)}
                onOpenContext={() => {
                  setContextOpen(true);
                  setMobileView("context");
                }}
              />
            ) : (
              <EmptyState icon={Info} title="Select a conversation" description="Choose a conversation from the list to view it here." />
            )}
          </div>

          {/* Context panel (desktop) */}
          <div className={cn("hidden min-h-0 flex-col lg:flex")}>
            {selected && <ContextPanel conversation={selected} />}
          </div>
        </div>
      )}

      {/* Context as sheet on tablet/mobile */}
      <Sheet
        open={contextOpen}
        onOpenChange={(open) => {
          setContextOpen(open);
          if (!open && mobileView === "context") setMobileView("conversation");
        }}
      >
        <SheetContent side="right" className="lg:hidden">
          <SheetHeader>
            <SheetTitle>Customer context</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-2">
              <ContextPanel conversation={selected} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Assignee picker */}
      <Sheet open={assigneeOpen} onOpenChange={setAssigneeOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Escalate conversation</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {TEAM.map((member) => (
              <button
                key={member.id}
                onClick={() => selected && escalateTo(selected.id, member.name)}
                className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-elevated"
              >
                <span>
                  <span className="block font-medium">{member.name}</span>
                  <span className="block text-caption text-muted-foreground">{member.role}</span>
                </span>
                <UserCog className="size-4 text-muted-foreground" aria-hidden="true" />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[160px] text-sm" aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ConversationList({
  items,
  selectedId,
  onSelect,
}: {
  items: Conversation[];
  selectedId?: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <ul role="list">
        {items.map((c) => {
          const Icon = CHANNEL_ICONS[c.channel];
          const active = c.id === selectedId;
          return (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-elevated",
                  active && "bg-elevated",
                )}
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{c.customer}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {c.unread && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-caption text-muted-foreground">{c.preview}</span>
                  <span className="mt-1.5 flex items-center gap-1.5">
                    <ToneBadge tone={c.handledBy === "ai" ? "info" : "neutral"} className="px-1.5 py-0.5 text-[10px]">
                      {c.handledBy === "ai" ? "AI" : "Human"}
                    </ToneBadge>
                    <ToneBadge tone={STATUS_TONE[c.status]} className="px-1.5 py-0.5 text-[10px]">
                      {c.status}
                    </ToneBadge>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ConversationThread({
  conversation,
  draft,
  setDraft,
  typing,
  onBack,
  onSend,
  onRetry,
  onEscalate,
  onOpenContext,
}: {
  conversation: Conversation;
  draft: string;
  setDraft: (v: string) => void;
  typing: boolean;
  onBack: () => void;
  onSend: () => void;
  onRetry: (messageId: string) => void;
  onEscalate: () => void;
  onOpenContext: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack} aria-label="Back to conversation list">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{conversation.customer}</p>
            <p className="truncate text-caption text-muted-foreground">{conversation.email}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEscalate}>
            Escalate
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenContext} aria-label="View customer context">
            <Info className="size-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {conversation.messages.map((m) => (
          <MessageBubble key={m.id} message={m} onRetry={() => onRetry(m.id)} />
        ))}
        {typing && (
          <div className="flex items-center gap-2 text-caption text-muted-foreground">
            <Bot className="size-4" aria-hidden="true" />
            <span className="flex gap-1">
              <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-current" />
            </span>
            AI is typing…
          </div>
        )}
      </div>

      <form
        className="flex items-end gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <label htmlFor="reply-box" className="sr-only">
          Write a reply
        </label>
        <Textarea
          id="reply-box"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a reply…"
          className="min-h-[44px] flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <Button type="submit" size="icon" aria-label="Send reply" disabled={!draft.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({ message, onRetry }: { message: Message; onRetry: () => void }) {
  const isCustomer = message.author === "customer";
  const isAI = message.author === "ai";
  return (
    <div className={cn("flex flex-col", isCustomer ? "items-start" : "items-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
          isCustomer && "bg-surface border border-border text-foreground",
          isAI && "bg-primary/10 border border-primary/25 text-foreground",
          !isCustomer && !isAI && "bg-primary text-primary-foreground",
        )}
      >
        <p className="mb-0.5 flex items-center gap-1.5 text-[11px] font-medium opacity-80">
          {isAI ? <Bot className="size-3" aria-hidden="true" /> : <User className="size-3" aria-hidden="true" />}
          {message.authorName}
        </p>
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
        {message.pending && <span>Sending…</span>}
        {message.failed && (
          <button onClick={onRetry} className="inline-flex items-center gap-1 text-danger hover:underline">
            <RotateCcw className="size-3" aria-hidden="true" />
            Failed — retry
          </button>
        )}
        {!message.pending && !message.failed && <span>{message.timestamp}</span>}
      </div>
    </div>
  );
}

function ContextPanel({ conversation }: { conversation: Conversation }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="flex items-center gap-3">
        <EmployeeAvatar type={conversation.employee} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{conversation.customer}</p>
          <p className="truncate text-caption text-muted-foreground">{conversation.company ?? conversation.email}</p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="truncate text-foreground">{conversation.email}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Channel</dt>
          <dd className="text-foreground">{CHANNEL_LABELS[conversation.channel]}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">AI Employee</dt>
          <dd className="text-foreground">{EMPLOYEE_LABELS[conversation.employee]}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <ToneBadge tone={STATUS_TONE[conversation.status]}>{conversation.status}</ToneBadge>
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <h3 className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">Internal notes</h3>
        <ul className="mt-2 space-y-2">
          {conversation.notes.length === 0 && <p className="text-caption text-muted-foreground">No notes yet.</p>}
          {conversation.notes.map((note, i) => (
            <li key={i} className="rounded-lg border border-border bg-surface p-2.5 text-caption text-foreground">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
