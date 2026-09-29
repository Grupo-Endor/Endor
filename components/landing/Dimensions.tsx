const DIMENSIONS = [
  {
    n: "01",
    weight: "20%",
    title: "Identidad visual",
    q: "¿Tu logo se distingue de tus competidores puestos en fila, sin nombre?",
  },
  {
    n: "02",
    weight: "20%",
    title: "Claridad de propuesta",
    q: "¿Se entiende en 5 segundos qué vendes, a quién y por qué a ti?",
  },
  {
    n: "03",
    weight: "15%",
    title: "Voz y contenido",
    q: "¿Habla la misma persona en cada publicación, o cambia de cuenta en cuenta?",
  },
  {
    n: "04",
    weight: "15%",
    title: "Coherencia en puntos de contacto",
    q: "¿Cuántas marcas distintas aparecen entre tu sitio, redes, empaque y sucursal?",
  },
  {
    n: "05",
    weight: "15%",
    title: "Presencia y encontrabilidad",
    q: "Cuando alguien le pregunta a una IA por tu categoría en tu zona, ¿te menciona?",
  },
  {
    n: "06",
    weight: "15%",
    title: "Diferenciación real",
    q: "Quitando logo y nombre, ¿se puede saber que una pieza es tuya?",
  },
];

export function Dimensions() {
  return (
    <section className="border-t border-white/10 px-5 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl tracking-tight sm:text-4xl">
          Qué analizamos
        </h2>
        <p className="mt-3 text-center text-neutral-400">
          6 dimensiones. Cero criterios de gusto.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIMENSIONS.map((d) => (
            <article
              key={d.n}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-sm text-neutral-500">{d.n}</span>
                <span className="text-sm font-semibold text-endor-accent">
                  {d.weight}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{d.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                {d.q}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
