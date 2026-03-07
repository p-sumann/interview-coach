import { Logo } from "@/components/shared/logo";

export function Footer() {
  return (
    <footer className="border-t border-border/30 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <p className="text-xs text-muted-foreground/50">
          Powered by Gemini Live API + LiveKit
        </p>
      </div>
    </footer>
  );
}
