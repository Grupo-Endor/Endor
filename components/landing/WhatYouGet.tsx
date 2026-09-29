const ITEMS = [
  { t: "Veredicto", d: "Una oración que resume dónde estás parado." },
  { t: "Puntaje global", d: "Tu calificación y tu lugar contra el grupo analizado." },
  { t: "Semáforo de 6 dimensiones", d: "Rojo, amarillo o verde. Sin rodeos." },
  {
    t: "Los 3 hallazgos que más pesan",
    d: "Cada uno con su evidencia: captura, conteo o cita.",
  },
  {
    t: "Lo que ya funciona",
    d: "Tus verdes, para que confíes en que los rojos también son ciertos.",
  },
  {
    t: "El patrón de tu sector",
    d: "Lo que todos hacen igual, y cuántos elementos tuyos caen ahí.",
  },
  {
    t: "Punto ciego",
    d: "Lo que no pudimos evaluar, y por qué importa en tu rubro.",
  },
];

export function WhatYouGet() {
  return (
    <section className="border-t border-white/10 px-5 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl tracking-tight sm:text-4xl">
          Lo que recibes
        </h2>
        <p className="mt-3 text-center text-neutral-400">
          Un reporte que se lee en{" "}
          <span className="text-endor-accent">4 minutos</span>.
        </p>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {ITEMS.map((item) => (
            <li
              key={item.t}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <h3 className="font-semibold">{item.t}</h3>
              <p className="mt-2 text-sm text-neutral-400">{item.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
