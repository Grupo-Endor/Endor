import Link from "next/link";

export function FinalCta() {
  return (
    <section className="border-t border-white/10 px-5 py-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-endor-accent/30 bg-endor-accent/5 px-8 py-14 text-center">
        <h2 className="text-3xl tracking-tight sm:text-4xl">
          Diagnostica tu marca{" "}
          <span className="text-endor-accent">gratis</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-neutral-300">
          Te pedimos evidencia, no opiniones. Lo que no subas se marca como “no
          evaluado”; no lo inventamos ni te penalizamos.
        </p>
        <Link
          href="/diagnostico"
          className="mt-8 inline-flex rounded-full bg-endor-accent px-8 py-3.5 font-semibold text-endor-black transition hover:brightness-95"
        >
          Diagnosticar mi marca
        </Link>
      </div>
    </section>
  );
}
