"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

type SectionRevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** direction d'apparition */
  y?: number;
};

/**
 * Révèle son contenu (fade + translation) quand il entre dans le viewport.
 * Respecte prefers-reduced-motion.
 */
export function SectionReveal({
  children,
  className,
  delay = 0,
  y = 18,
}: SectionRevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
