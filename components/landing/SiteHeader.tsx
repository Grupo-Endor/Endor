import Link from "next/link";
import { EndorLogo } from "@/components/EndorLogo";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-endor-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" aria-label="Inicio">
          <EndorLogo className="h-7 w-auto" variant="light" />
        </Link>
        <Link
          href="/diagnostico"
          className="rounded-full bg-endor-accent px-4 py-2 text-sm font-semibold text-endor-black transition hover:brightness-95"
        >
          Diagnosticar mi marca
        </Link>
      </div>
    </header>
  );
}
