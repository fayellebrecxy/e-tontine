import * as React from "react";

type LogoMarkProps = {
  className?: string;
  style?: React.CSSProperties;
  /** Couleur principale du symbole */
  color?: string;
  /** Couleur d'accent (personnes) */
  accent?: string;
};

/**
 * Logomark E-Tontine : un cercle de personnes stylisées autour d'un centre,
 * symbolisant la solidarité et l'épargne tournante (tontine).
 * SVG vectoriel, net à toutes les tailles.
 */
export function LogoMark({
  className,
  style,
  color = "#006b2c",
  accent = "#62df7d",
}: LogoMarkProps) {
  // Cercle de personnes qui se tiennent : les bras forment l'anneau (solidarité),
  // les têtes apparaissent dessus, un cœur au centre (entraide / humain).
  const people = 5;
  const ringR = 15;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="E-Tontine"
    >
      {/* Anneau = bras qui se rejoignent / mains liées */}
      <circle cx="24" cy="24" r={ringR} stroke="url(#etontine-grad)" strokeWidth="3.4" strokeLinecap="round" />

      {/* Têtes des personnes posées sur l'anneau */}
      {Array.from({ length: people }).map((_, i) => {
        const angle = (i / people) * Math.PI * 2 - Math.PI / 2;
        const cx = 24 + Math.cos(angle) * ringR;
        const cy = 24 + Math.sin(angle) * ringR;
        const fill = i % 2 === 0 ? color : accent;
        return (
          <circle key={i} cx={cx} cy={cy} r="3.1" fill={fill} stroke="#ffffff" strokeWidth="1.1" />
        );
      })}

      {/* Cœur central : entraide */}
      <path
        d="M24 29.5c-3.4-2.2-5.4-4-5.4-6.3 0-1.7 1.3-2.9 2.9-2.9 1 0 1.9.5 2.5 1.3.6-.8 1.5-1.3 2.5-1.3 1.6 0 2.9 1.2 2.9 2.9 0 2.3-2 4.1-5.4 6.3z"
        fill={color}
      />

      <defs>
        <linearGradient id="etontine-grad" x1="9" y1="9" x2="39" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor={accent} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
    </svg>
  );
}

type LogoProps = {
  className?: string;
  /** Affiche le nom à côté du symbole */
  showWordmark?: boolean;
  /** Variante de couleur pour fond sombre */
  variant?: "default" | "light";
  /** Taille du symbole en px */
  size?: number;
};

/**
 * Logo complet E-Tontine : symbole + wordmark.
 */
export function Logo({
  className = "",
  showWordmark = true,
  variant = "default",
  size = 32,
}: LogoProps) {
  const isLight = variant === "light";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark
        style={{ width: size, height: size }}
        className="shrink-0"
        color={isLight ? "#ffffff" : "#006b2c"}
        accent={isLight ? "#7ffc97" : "#62df7d"}
      />
      {showWordmark && (
        <span
          className={`font-heading font-bold tracking-tight ${
            isLight ? "text-white" : "text-primary"
          }`}
          style={{ fontSize: size * 0.6 }}
        >
          E-Tontine
        </span>
      )}
    </span>
  );
}
