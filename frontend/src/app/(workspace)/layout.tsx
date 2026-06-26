import Link from "next/link";
import { OrbNav } from "@/components/dock/orb-nav";
import { CommandPaletteHint } from "@/components/dock/command-palette-hint";
import { SignInGate } from "@/components/auth/sign-in-gate";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen pb-32">
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-teal via-accent-blue to-accent-violet">
            <span className="h-2 w-2 rounded-full bg-bg-primary" />
          </span>
          <span className="font-display text-sm tracking-wide text-highlight/90">
            Audience AI
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <CommandPaletteHint />
        </div>
      </header>
      <main className="px-4 pt-24 sm:px-8">
        <SignInGate>{children}</SignInGate>
      </main>
      <OrbNav />
    </div>
  );
}
