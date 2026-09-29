/**
 * Nunca escribir la palabra del logo como texto tipográfico.
 * Placeholder SVG monocromo — sustituir por asset oficial.
 */
export function EndorLogo({
  className = "h-8 w-auto",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const fill = variant === "light" ? "#FFFFFF" : "#0A0A0A";
  return (
    <svg
      className={className}
      viewBox="0 0 120 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ēndor"
    >
      {/* Marca tipográfica como paths — no texto seleccionable */}
      <path
        d="M4 4h12.5v3.2H8.2v4.2h7.4v3.1H8.2v5.3H17V23H4V4z"
        fill={fill}
      />
      <path
        d="M22 8.2c2.4-1.6 5.6-1.9 8.2-.6 2.4 1.2 3.9 3.7 3.9 6.5s-1.5 5.3-3.9 6.5c-2.6 1.3-5.8 1-8.2-.6V8.2zm4.2 3.1v7.2c1.1.7 2.5.9 3.7.3 1.4-.7 2.2-2.1 2.2-3.9s-.8-3.2-2.2-3.9c-1.2-.6-2.6-.4-3.7.3z"
        fill={fill}
      />
      <path
        d="M38 8.5c1.8-1.5 4.3-2 6.6-1.4 1.9.5 3.4 1.9 4.1 3.7l-3.6 1.3c-.3-.9-1.1-1.6-2.1-1.8-1.6-.3-3.1.7-3.5 2.2-.4 1.6.6 3.2 2.2 3.7 1 .3 2.1 0 2.8-.7l.4 3.4c-1.2.7-2.7.9-4.1.6-3.2-.7-5.4-3.6-5.4-6.9 0-1.6.6-3.1 1.6-4.1z"
        fill={fill}
      />
      <path
        d="M52 4h4.2v7.1l5.8-7.1H67l-5.5 6.5L68 23h-4.8l-4.1-6.3-2.9 3.4V23H52V4z"
        fill={fill}
      />
      <path
        d="M72 4h12.5v3.2h-8.3v4.2h7.4v3.1h-7.4v5.3H85V23H72V4z"
        fill={fill}
      />
      <path
        d="M90 13.8c0-5.2 3.5-9.2 8.8-9.2 3.2 0 5.7 1.3 7.1 3.5l-3.4 2c-.8-1.2-2.1-1.9-3.7-1.9-2.9 0-4.7 2.3-4.7 5.6s1.8 5.6 4.7 5.6c1.6 0 2.9-.7 3.7-1.9l3.4 2c-1.4 2.2-3.9 3.5-7.1 3.5-5.3 0-8.8-4-8.8-9.2z"
        fill={fill}
      />
      {/* Acento macron sobre E — detalle de marca */}
      <rect x="4" y="1.2" width="8" height="1.4" rx="0.4" fill="#FFE255" />
    </svg>
  );
}
