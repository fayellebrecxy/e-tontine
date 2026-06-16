import * as React from "react";
import Image from "next/image";

/** Chemin du logomark avec fond transparent */
export const LOGO_SRC = "/images/brand/logo.png";

type LogoMarkProps = {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
};

export function LogoMark({ className, style, size = 32 }: LogoMarkProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className ?? ""}`}
      style={style}
      priority
    />
  );
}

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  variant?: "default" | "light";
  size?: number;
};

/**
 * Logo E-Tontine : logomark (mains qui se rejoignent) + wordmark.
 */
export function Logo({
  className = "",
  showWordmark = true,
  variant = "default",
  size = 32,
}: LogoProps) {
  const isLight = variant === "light";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          className={`font-heading font-bold tracking-tight ${
            isLight ? "text-white" : "text-primary"
          }`}
          style={{ fontSize: size * 0.58 }}
        >
          E-Tontine
        </span>
      )}
    </span>
  );
}
