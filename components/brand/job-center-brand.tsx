import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function JobCenterBrand({
  href = "/",
  inverse = false,
  className,
}: {
  href?: string;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <Link
      aria-label="Accueil JOB CENTER"
      className={cn(
        "inline-flex items-center whitespace-nowrap",
        className,
      )}
      href={href}
      style={{ gap: "14px" }}
    >
      <Image
        alt="JOB CENTER Logo"
        className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
        height={44}
        src="/brand/job-center-mark.svg"
        width={44}
      />
      <span
        className={cn(
          "text-[18px] font-extrabold leading-none tracking-tight sm:text-[24px]",
          inverse ? "text-white" : "text-[#0F172A]",
        )}
      >
        JOB-CENTER
      </span>
    </Link>
  );
}
