import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDUSTRIES, BRAND_TONES, type WorkspaceSetupState } from "./types";

export function StepBusinessProfile({
  state,
  onChange,
}: {
  state: WorkspaceSetupState;
  onChange: (patch: Partial<WorkspaceSetupState>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 text-foreground">Tell us about your business</h2>
        <p className="mt-1 text-body text-muted-foreground">
          This helps your AI Employees speak with the right context and tone.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            placeholder="Acme Retail Co."
            value={state.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="industry">Industry</Label>
          <Select value={state.industry} onValueChange={(v) => onChange({ industry: v })}>
            <SelectTrigger id="industry">
              <SelectValue placeholder="Select an industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tone">Brand tone</Label>
          <Select value={state.tone} onValueChange={(v) => onChange({ tone: v })}>
            <SelectTrigger id="tone">
              <SelectValue placeholder="Select a tone" />
            </SelectTrigger>
            <SelectContent>
              {BRAND_TONES.map((tone) => (
                <SelectItem key={tone} value={tone}>
                  {tone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://www.example.com"
            value={state.website}
            onChange={(e) => onChange({ website: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
