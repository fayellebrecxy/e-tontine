"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Slide = {
  key: "avant" | "avec";
  image: string;
  label: string;
  caption: string;
  accent: string;
};

export type BeforeAfterLabels = {
  before: string;
  beforeCaption: string;
  after: string;
  afterCaption: string;
};

const DEFAULT_LABELS: BeforeAfterLabels = {
  before: "Avant",
  beforeCaption: "Carnets éparpillés, oublis, confusion.",
  after: "Avec E-Tontine",
  afterCaption: "Tout est clair, suivi et partagé.",
};

/**
 * Animation circulaire « Avant / Après » : l'état "Avant" s'affiche seul,
 * puis pivote pour révéler l'état "Avec E-Tontine", en boucle.
 */
export function BeforeAfter({ labels = DEFAULT_LABELS }: { labels?: BeforeAfterLabels }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);

  const SLIDES: Slide[] = React.useMemo(
    () => [
      {
        key: "avant",
        image: "/images/avant.png",
        label: labels.before,
        caption: labels.beforeCaption,
        accent: "#DC2626",
      },
      {
        key: "avec",
        image: "/images/avec.png",
        label: labels.after,
        caption: labels.afterCaption,
        accent: "#006b2c",
      },
    ],
    [labels],
  );

  const slide = SLIDES[index];

  React.useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 3600);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-64 w-64 sm:h-80 sm:w-80">
        {/* Anneau de progression circulaire */}
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="47" fill="none" stroke="#e3eadf" strokeWidth="2" />
          <motion.circle
            key={`ring-${index}`}
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke={slide.accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="295.3"
            initial={{ strokeDashoffset: 295.3 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: reduce ? 0 : 3.6, ease: "linear" }}
          />
        </svg>

        {/* Image circulaire animée */}
        <div className="absolute inset-3 overflow-hidden rounded-full shadow-ambient">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={slide.key}
              className="absolute inset-0"
              initial={reduce ? false : { rotate: -12, scale: 0.9, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { rotate: 12, scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Image
                src={slide.image}
                alt={slide.label}
                fill
                sizes="320px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Badge état */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur"
              style={{ backgroundColor: slide.accent }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {slide.label}
            </span>
          </div>
        </div>
      </div>

      {/* Légende + indicateurs */}
      <div className="flex flex-col items-center gap-3 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={slide.caption}
            className="font-sans text-sm text-on-surface-variant max-w-xs"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
          >
            {slide.caption}
          </motion.p>
        </AnimatePresence>
        <div className="flex gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              aria-label={s.label}
              onClick={() => setIndex(i)}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 24 : 8,
                backgroundColor: i === index ? slide.accent : "#bdcaba",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
