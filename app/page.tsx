import Link from "next/link";
import { EndorLogo } from "@/components/EndorLogo";
import { Reveal } from "@/components/Reveal";
import { DiagnosticForm } from "@/components/DiagnosticForm";

const PAINS = [
  "Tengo el mejor producto y el que se lleva los clientes es el que tiene mejor marca.",
  "Mi marca se ve igual que hace quince años y ya no representa lo que somos.",
  "Cuando explico lo que hacemos, suena igual que todos.",
  "Mi competencia no es mejor que yo, nada más se ve mejor y grita más fuerte.",
  "Ya le pagué a tres agencias y solo me dieron posts bonitos.",
  "Toda negociación termina en descuento porque no tengo con qué defender mi precio.",
];

const DIMENSIONS = [
  { n: "01", name: "Identidad visual", w: "20%", q: "¿Tu logo se distingue de tus competidores puestos en fila, sin nombre?" },
  { n: "02", name: "Claridad de propuesta", w: "20%", q: "¿Se entiende en 5 segundos qué vendes, a quién y por qué a ti?" },
  { n: "03", name: "Voz y contenido", w: "15%", q: "¿Habla la misma persona en cada publicación, o cambia de cuenta en cuenta?" },
  { n: "04", name: "Coherencia en puntos de contacto", w: "15%", q: "¿Cuántas marcas distintas aparecen entre tu sitio, redes, empaque y sucursal?" },
  { n: "05", name: "Presencia y encontrabilidad", w: "15%", q: "Cuando alguien le pregunta a una IA por tu categoría en tu zona, ¿te menciona?" },
  { n: "06", name: "Diferenciación real", w: "15%", q: "Quitando logo y nombre, ¿se puede saber que una pieza es tuya?" },
];

const REPORT = [
  ["Veredicto", "Una oración que resume dónde estás parado."],
  ["Puntaje global", "Tu calificación y tu lugar contra el grupo analizado."],
  ["Semáforo de 6 dimensiones", "Rojo, amarillo o verde. Sin rodeos."],
  ["Los 3 hallazgos que más pesan", "Cada uno con su evidencia: captura, conteo o cita."],
  ["Lo que ya funciona", "Tus verdes, para que confíes en que los rojos también son ciertos."],
  ["El patrón de tu sector", "Lo que todos hacen igual, y cuántos elementos tuyos caen ahí."],
  ["Punto ciego", "Lo que no pudimos evaluar, y por qué importa en tu rubro."],
];

const AUDIENCE = [
  ["Dueño o director general", "Sabe que su empresa es de las mejores y le duele que nadie lo sepa."],
  ["Socio o consejo", "Necesita datos, no opiniones, para decidir dónde invertir."],
  ["Dirección comercial", "Pierde cuentas contra competidores más chicos que \"se ven mejor\"."],
  ["Marketing o comunicación", "Publica todos los días y necesita demostrar qué está fallando y por qué."],
];

const FAQ = [
  ["¿Cuánto cuesta?", "Nada. El diagnóstico es gratuito. Te decimos qué está mal y cuánto te cuesta; el tratamiento es el servicio de Ēndor."],
  ["¿Me van a decir cómo arreglarlo?", "No. Diagnosticamos, no recetamos. Te decimos qué te duele, con evidencia, y qué tan grave es frente a tu rubro. Si quieres ir más allá, lo platicamos en una llamada de 20 minutos."],
  ["¿Qué pasa con el material que subo?", "Es tuyo. No lo reutilizamos ni lo compartimos. Lo único que se usa es el promedio de tu rubro, sin nombres."],
  ["¿Y si no tengo algo de lo que piden?", "Lo marcamos como \"no evaluado\". No lo inventamos ni te penalizamos."],
  ["¿Por qué debería creerle a un puntaje?", "Porque nada se califica por gusto. Cada criterio se verifica con evidencia, corremos dos evaluaciones independientes y, si difieren, las revisa una persona antes de entregarte."],
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <EndorLogo className="h-6 w-auto" />
          <Link
            href="#diagnostico"
            className="bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground md:px-5 md:text-xs"
          >
            Diagnosticar mi marca
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 md:px-6 md:pb-28 md:pt-24">
        <Reveal>
          <p className="section-label">Diagnóstico de marca gratuito</p>
          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight md:text-7xl">
            El mejor producto de tu categoría.{" "}
            <span className="font-accent font-normal italic">Y nadie lo sabe.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Descubre qué le duele a tu marca, qué tan grave es y dónde quedas frente a quien te quita clientes.
            Con evidencia, no con opiniones.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="#diagnostico" className="btn-cta">
              Diagnosticar mi marca
            </Link>
            <span className="text-sm text-muted-foreground">5 minutos para llenarlo · Sin costo</span>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="mt-16 grid grid-cols-3 border-y border-border">
            {(
              [
                ["1,500+", "marcas desarrolladas"],
                ["15", "años creando marcas"],
                ["14+", "países"],
              ] as const
            ).map(([n, l]) => (
              <div key={l} className="border-r border-border py-6 pr-4 last:border-r-0 md:py-8">
                <p className="text-2xl font-black md:text-4xl">{n}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Dolores */}
      <section className="bg-foreground py-20 text-background md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">¿Te suena?</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">
              Vendes, tienes clientes y tienes producto. Lo que no tienes es{" "}
              <span className="font-accent font-normal italic">marca.</span>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-px bg-background/15 md:grid-cols-2 lg:grid-cols-3">
            {PAINS.map((p, i) => (
              <Reveal key={p} delay={i * 60} className="bg-foreground p-8">
                <p className="font-accent text-4xl leading-none text-primary">“</p>
                <p className="mt-2 text-lg leading-snug">{p}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Principio */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <div className="grid gap-12 md:grid-cols-2 md:items-end">
          <Reveal>
            <p className="section-label">Cómo trabajamos</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              Diagnosticamos. <span className="font-accent font-normal italic">No recetamos.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Evaluamos lo que tu marca ya tiene, no lo que dice que quiere ser. Detectamos lo que todo tu sector hace igual
              y te ubicamos dentro o fuera de ese patrón. Sabemos distinguir un error de una apuesta deliberada: si decidiste
              salirte de lo esperado y se nota, lo respetamos.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Dimensiones */}
      <section className="border-t border-border bg-secondary py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <p className="section-label">Qué analizamos</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">
              6 dimensiones. Cero criterios de gusto.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
            {DIMENSIONS.map((d, i) => (
              <Reveal key={d.n} delay={i * 60} className="flex flex-col bg-background p-8">
                <div className="flex items-baseline justify-between">
                  <span className="font-accent text-3xl italic text-muted-foreground">{d.n}</span>
                  <span className="text-xs font-bold tracking-[0.14em] text-muted-foreground">{d.w}</span>
                </div>
                <h3 className="mt-6 text-xl font-extrabold">{d.name}</h3>
                <p className="mt-3 text-muted-foreground">{d.q}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Semáforo + comparativa */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <div className="grid gap-16 lg:grid-cols-2">
          <Reveal>
            <p className="section-label">El semáforo</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">Un verde no se regala.</h2>
            <p className="mt-4 text-muted-foreground">
              Solo es verde si superas a la mediana de tu rubro. Estar “bien” donde todos están bien es amarillo.
            </p>
            <div className="mt-10 space-y-4">
              {(
                [
                  ["bg-signal-red", "0 – 39", "Estás perdiendo clientes por esto hoy."],
                  ["bg-signal-yellow", "40 – 79", "Funciona, pero no te diferencia."],
                  ["bg-signal-green", "80 – 100", "Es una fortaleza. Cuídala."],
                ] as const
              ).map(([c, r, t]) => (
                <div key={r} className="flex items-center gap-5 border border-border p-5">
                  <span className={`h-4 w-4 shrink-0 rounded-full ${c}`} />
                  <span className="w-20 shrink-0 text-sm font-bold">{r}</span>
                  <span className="text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <p className="section-label">Contra tu competencia</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">
              ¿Te compran a ti, o <span className="font-accent font-normal italic">compran la categoría?</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Te comparamos contra 3 a 5 competidores que tú confirmas. Si caes en el patrón de tu sector en 3 o más elementos,
              eres una marca de categoría: el cliente te elige por precio, no por ti.
            </p>
            <ul className="mt-8 space-y-3 border-l-2 border-primary pl-6">
              <li>Tu posición en cada dimensión: arriba, en la mediana o abajo.</li>
              <li>El patrón de tu sector en una sola oración.</li>
              <li>Cuántos de tus elementos coinciden con ese patrón.</li>
              <li>Quién de tu grupo se sale del patrón. Esa es tu amenaza real.</li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Reporte */}
      <section className="bg-foreground py-20 text-background md:py-28">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 md:px-6 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Lo que recibes</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              Un reporte que se lee en <span className="font-accent font-normal italic">4 minutos.</span>
            </h2>
            <p className="mt-6 text-background/70">
              En pantalla y en PDF de una página, listo para reenviarlo a tu socio, a tu consejo o a tu equipo.
              Sales sabiendo exactamente qué está mal y cuánto te cuesta.
            </p>
          </Reveal>
          <ol className="divide-y divide-background/15 border-y border-background/15">
            {REPORT.map(([t, d], i) => (
              <Reveal key={t} delay={i * 50}>
                <li className="flex gap-6 py-5">
                  <span className="w-6 shrink-0 text-sm font-bold text-primary">{i + 1}</span>
                  <div>
                    <p className="font-bold">{t}</p>
                    <p className="mt-1 text-sm text-background/60">{d}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Para quién */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <Reveal>
          <p className="section-label">Para quién es</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">
            Para empresas que ya venden y quieren ser la{" "}
            <span className="font-accent font-normal italic">primera opción</span> de su industria.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {AUDIENCE.map(([t, d], i) => (
            <Reveal key={t} delay={i * 60} className="border-t-2 border-foreground pt-6">
              <h3 className="text-lg font-extrabold">{t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Formulario */}
      <section id="diagnostico" className="scroll-mt-16 border-t border-border bg-secondary py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 md:px-6 lg:grid-cols-[1fr_1.5fr]">
          <Reveal>
            <p className="section-label">Empieza aquí</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              Diagnostica tu marca <span className="font-accent font-normal italic">gratis.</span>
            </h2>
            <p className="mt-6 text-muted-foreground">
              Te pedimos evidencia, no opiniones. La versión mínima toma 5 minutos. Lo que no subas se marca como
              “no evaluado”; no lo inventamos ni te penalizamos.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Lo que subes es tuyo. No lo reutilizamos ni lo compartimos.
            </p>
            <p className="mt-8 text-sm text-muted-foreground">
              También puedes usar el{" "}
              <Link href="/diagnostico" className="font-bold text-foreground underline underline-offset-4">
                asistente paso a paso
              </Link>
              .
            </p>
          </Reveal>
          <Reveal delay={100}>
            <DiagnosticForm />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 md:px-6 md:py-28">
        <p className="section-label">Preguntas frecuentes</p>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                {q}
                <span className="text-2xl text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="bg-foreground text-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-6">
          <EndorLogo className="h-7 w-auto text-background" />
          <p className="text-xs text-background/50">
            © 2026 Grupo Endor · 15 años creando marcas · +1,500 marcas · +14 países
          </p>
        </div>
      </footer>
    </div>
  );
}
