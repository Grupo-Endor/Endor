import type { SemaphoreColor } from "@/types/diagnosis";

const COLORS: Record<SemaphoreColor, string> = {
  red: "bg-red-500",
  yellow: "bg-[#FFE255]",
  green: "bg-emerald-500",
  not_evaluated: "bg-neutral-500",
};

export function SemaphoreDot({
  color,
  className = "h-3 w-3",
}: {
  color: SemaphoreColor;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-full ${COLORS[color]} ${className}`}
      aria-hidden
    />
  );
}
