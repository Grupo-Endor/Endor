const ITEMS = [
  "Tengo el mejor producto y el que se lleva los clientes es el que tiene mejor marca.",
  "Mi marca se ve igual que hace quince años y ya no representa lo que somos.",
  "Cuando explico lo que hacemos, suena igual que todos.",
  "Mi competencia no es mejor que yo, nada más se ve mejor y grita más fuerte.",
  "Ya le pagué a tres agencias y solo me dieron posts bonitos.",
  "Toda negociación termina en descuento porque no tengo con qué defender mi precio.",
];

export function SoundsFamiliar() {
  return (
    <section className="border-t border-white/10 px-5 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl tracking-tight sm:text-4xl">
          ¿Te suena?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-neutral-300">
          Vendes, tienes clientes y tienes producto. Lo que no tienes es{" "}
          <span className="text-endor-accent">marca</span>.
        </p>
        <ul className="mt-12 space-y-4">
          {ITEMS.map((text) => (
            <li
              key={text}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-neutral-200"
            >
              {text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
