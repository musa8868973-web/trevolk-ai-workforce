import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.42-1.6 4.17-5.27 4.17-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.9 3.98 14.7 3 12.18 3 6.98 3 2.77 7.2 2.77 12.4s4.21 9.4 9.41 9.4c5.43 0 9.03-3.82 9.03-9.2 0-.62-.07-1.09-.15-1.5z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" fill="currentColor" opacity="0.85" />
      <rect x="13" y="3" width="8" height="8" fill="currentColor" opacity="0.65" />
      <rect x="3" y="13" width="8" height="8" fill="currentColor" opacity="0.65" />
      <rect x="13" y="13" width="8" height="8" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

export function SsoButtons() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => toast.info("Google sign-in is a demo in this workspace.")}
      >
        <GoogleIcon />
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => toast.info("Microsoft sign-in is a demo in this workspace.")}
      >
        <MicrosoftIcon />
        Continue with Microsoft
      </Button>
    </div>
  );
}
