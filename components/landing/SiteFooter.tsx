import { EndorLogo } from "@/components/EndorLogo";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <EndorLogo className="h-6 w-auto opacity-80" variant="light" />
        <p className="text-center text-xs text-neutral-500">
          © 2026 Grupo Endor · 15 años creando marcas · +1,500 marcas · +14 países
        </p>
      </div>
    </footer>
  );
}
