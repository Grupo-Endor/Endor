const FAQS = [
  {
    q: "¿Cuánto cuesta?",
    a: "Nada. El diagnóstico es gratuito. Te decimos qué está mal y cuánto te cuesta; el tratamiento es el servicio de Ēndor.",
  },
  {
    q: "¿Me van a decir cómo arreglarlo?",
    a: "No. Diagnosticamos, no recetamos. Te decimos qué te duele, con evidencia, y qué tan grave es frente a tu rubro. Si quieres ir más allá, lo platicamos en una llamada de 20 minutos.",
  },
  {
    q: "¿Qué pasa con el material que subo?",
    a: "Es tuyo. No lo reutilizamos ni lo compartimos. Lo único que se usa es el promedio de tu rubro, sin nombres.",
  },
  {
    q: "¿Y si no tengo algo de lo que piden?",
    a: 'Lo marcamos como "no evaluado". No lo inventamos ni te penalizamos.',
  },
  {
    q: "¿Por qué debería creerle a un puntaje?",
    a: "Porque nada se califica por gusto. Cada criterio se verifica con evidencia, corremos dos evaluaciones independientes y, si difieren, las revisa una persona antes de entregarte.",
  },
];

export function Faq() {
  return (
    <section className="border-t border-white/10 px-5 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl tracking-tight sm:text-4xl">
          Preguntas frecuentes
        </h2>
        <div className="mt-12 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
            >
              <summary className="cursor-pointer list-none font-semibold marker:content-none">
                {f.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
