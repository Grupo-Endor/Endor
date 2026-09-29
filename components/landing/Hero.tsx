import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,226,85,0.12),_transparent_55%)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-endor-accent">
          Diagnóstico de marca gratuito
        </p>
        <h1 className="text-4xl leading-tight tracking-tight sm:text-5xl md:text-6xl">
          El mejor producto de tu categoría.
          <br />
          <span className="text-endor-muted">Y nadie lo sabe.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-300">
          Descubre qué le duele a tu marca, qué tan grave es y dónde quedas frente
          a quien te quita clientes. Con evidencia, no con opiniones.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/diagnostico"
            className="inline-flex rounded-full bg-endor-accent px-8 py-3.5 text-base font-semibold text-endor-black transition hover:brightness-95"
          >
            Diagnosticar mi marca
          </Link>
          <p className="text-sm text-neutral-400">
            5 minutos para llenarlo · Sin costo
          </p>
        </div>
        <dl className="mx-auto mt-16 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-10 text-center">
          <div>
            <dt className="text-2xl font-semibold text-white sm:text-3xl">1,500+</dt>
            <dd className="mt-1 text-xs text-neutral-400">marcas desarrolladas</dd>
          </div>
          <div>
            <dt className="text-2xl font-semibold text-white sm:text-3xl">15</dt>
            <dd className="mt-1 text-xs text-neutral-400">años creando marcas</dd>
          </div>
          <div>
            <dt className="text-2xl font-semibold text-white sm:text-3xl">14+</dt>
            <dd className="mt-1 text-xs text-neutral-400">países</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
