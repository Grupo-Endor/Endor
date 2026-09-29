export function Semaphore() {
  return (
    <section className="border-t border-white/10 px-5 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl tracking-tight sm:text-4xl">El semáforo</h2>
        <p className="mt-4 text-neutral-300">
          Un verde no se regala. Solo es verde si superas a la mediana de tu
          rubro. Estar “bien” donde todos están bien es amarillo.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="mx-auto mb-3 h-4 w-4 rounded-full bg-red-500" />
            <p className="font-semibold">0 – 39</p>
            <p className="mt-2 text-sm text-neutral-300">
              Estás perdiendo clientes por esto hoy.
            </p>
          </div>
          <div className="rounded-2xl border border-endor-accent/40 bg-endor-accent/10 p-6">
            <div className="mx-auto mb-3 h-4 w-4 rounded-full bg-endor-accent" />
            <p className="font-semibold">40 – 79</p>
            <p className="mt-2 text-sm text-neutral-300">
              Funciona, pero no te diferencia.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <div className="mx-auto mb-3 h-4 w-4 rounded-full bg-emerald-500" />
            <p className="font-semibold">80 – 100</p>
            <p className="mt-2 text-sm text-neutral-300">
              Es una fortaleza. Cuídala.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
