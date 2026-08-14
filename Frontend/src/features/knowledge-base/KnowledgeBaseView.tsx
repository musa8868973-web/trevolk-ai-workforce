import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, MoreHorizontal, UploadCloud, Plus } from "lucide-react";
import { useKnowledgeItems } from "@/hooks/useTrevolkData";
import type { KnowledgeItem, SyncStatus } from "@/types";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/States";
import { ToneBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const SYNC_TONE: Record<SyncStatus, "success" | "warning" | "danger"> = {
  synced: "success",
  syncing: "warning",
  failed: "danger",
};

const SYNC_HELP: Record<SyncStatus, string> = {
  synced: "This content is fully indexed and available to your AI Employees.",
  syncing: "This content is currently being processed.",
  failed: "Indexing failed — remove and re-upload this content.",
};

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

export function KnowledgeBaseView() {
  const { data, isLoading, isError, refetch } = useKnowledgeItems();
  const [items, setItems] = useState<KnowledgeItem[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeItem | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const list = items ?? data ?? [];

  function ensure(): KnowledgeItem[] {
    if (items) return items;
    const base = data ? structuredClone(data) : [];
    setItems(base);
    return base;
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const base = ensure();
    setItems(base.filter((i) => i.id !== deleteTarget.id));
    toast.success(`${deleteTarget.name} deleted`);
    setDeleteTarget(null);
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const entries: UploadingFile[] = Array.from(files).map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      progress: 0,
    }));
    setUploads((u) => [...u, ...entries]);
    entries.forEach((entry) => {
      const interval = setInterval(() => {
        setUploads((prev) =>
          prev.map((u) => (u.id === entry.id ? { ...u, progress: Math.min(100, u.progress + 20) } : u)),
        );
      }, 300);
      setTimeout(() => {
        clearInterval(interval);
        setUploads((prev) => prev.filter((u) => u.id !== entry.id));
        const base = ensure();
        setItems([
          { id: `k-${Date.now()}`, name: entry.name, type: "Doc", updatedAt: "Just now", sync: "syncing", usedBy: [] },
          ...base,
        ]);
        toast.success(`${entry.name} uploaded`);
      }, 1800);
    });
  }

  function saveFaq() {
    if (!faqQuestion.trim()) return;
    const base = ensure();
    setItems([
      { id: `k-${Date.now()}`, name: faqQuestion, type: "FAQ", updatedAt: "Just now", sync: "synced", usedBy: [] },
      ...base,
    ]);
    toast.success("FAQ added");
    setFaqOpen(false);
    setFaqQuestion("");
    setFaqAnswer("");
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Knowledge Base" description="The documents and FAQs your AI Employees learn from." />
        <SectionCard>
          <TableSkeleton rows={6} />
        </SectionCard>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Knowledge Base" description="The documents and FAQs your AI Employees learn from." />
        <SectionCard>
          <ErrorState onRetry={() => refetch()} />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base"
        description="The documents and FAQs your AI Employees learn from."
        actions={
          <Button onClick={() => setFaqOpen(true)}>
            <Plus className="mr-1.5 size-4" /> Add Content
          </Button>
        }
      />

      <SectionCard title="Upload content" description="Drop files to add them to your knowledge base.">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <UploadCloud className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-foreground">Drag and drop files here, or click to browse</p>
          <p className="text-caption text-muted-foreground">PDF, DOCX, TXT up to 20MB</p>
          <input type="file" multiple className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
        </label>

        {uploads.length > 0 && (
          <div className="mt-4 space-y-3">
            {uploads.map((u) => (
              <div key={u.id}>
                <div className="mb-1 flex items-center justify-between text-caption text-muted-foreground">
                  <span className="truncate">{u.name}</span>
                  <span className="tabular">{u.progress}%</span>
                </div>
                <Progress value={u.progress} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {list.length === 0 ? (
        <SectionCard>
          <EmptyState icon={BookOpen} title="No content yet" description="Upload documents or add FAQs to teach your AI Employees." />
        </SectionCard>
      ) : (
        <SectionCard title="Documents & FAQs" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead>Sync status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.updatedAt}</TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <ToneBadge tone={SYNC_TONE[item.sync]} withDot>
                              {item.sync}
                            </ToneBadge>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{SYNC_HELP[item.sync]}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${item.name}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.success(`Re-syncing ${item.name}`)}>Re-sync</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(item)}
                            className="text-danger focus:text-danger"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove it from your knowledge base and your AI Employees will no longer use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-danger text-danger-foreground hover:bg-danger/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add FAQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="faq-question">Question</Label>
              <Input id="faq-question" value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="faq-answer">Answer</Label>
              <Textarea id="faq-answer" value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} rows={4} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveFaq} disabled={!faqQuestion.trim()}>
              Save FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
