import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string;
  alt?: string;
  initial?: string;
  size?: "sm" | "lg";
  className?: string;
}

export function Avatar({ src, alt, initial, size = "sm", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? "Avatar"}
        className={cn(
          "flex-none rounded-full object-cover",
          size === "sm" ? "h-7.5 w-7.5 border border-accent/20" : "h-16 w-16 border-2 border-[var(--color-accent-light)]",
          className,
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid flex-none place-items-center rounded-full bg-accent-light font-extrabold text-accent",
        size === "sm" ? "h-7.5 w-7.5 text-xs" : "h-16 w-16 text-[22px] border-2 border-[var(--color-accent-light)]",
        className,
      )}
    >
      {initial ?? "?"}
    </span>
  );
}
