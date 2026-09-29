import Link from "next/link";
import { EndorLogo } from "@/components/EndorLogo";
import { DiagnosticoWizard } from "@/components/diagnostico/DiagnosticoWizard";

export const metadata = {
  title: "Diagnóstico | Ēndor",
  description: "Intake de evidencia para el diagnóstico de marca gratuito.",
};

export default function DiagnosticoPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 px-5 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <Link href="/">
            <EndorLogo className="h-7 w-auto" />
          </Link>
          <p className="text-xs text-neutral-500">
            Diagnosticamos. No recetamos.
          </p>
        </div>
      </header>
      <DiagnosticoWizard />
    </div>
  );
}
