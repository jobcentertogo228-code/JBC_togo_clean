import { cn } from "@/lib/utils";
import Image from "next/image";

export function Avatar({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "J";

  return imageUrl ? (
    <Image
      alt={name || "Profil candidat"}
      className={cn("h-10 w-10 rounded-full object-cover", className)}
      height={40}
      src={imageUrl}
      unoptimized
      width={40}
    />
  ) : (
    <span
      aria-label={name || "Profil candidat"}
      className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary", className)}
      role="img"
    >
      {initials}
    </span>
  );
}
