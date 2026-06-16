"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

type PageRevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

/** Apparition fluide au chargement de la page (montage, pas au scroll). */
export function PageReveal({ children, className, delay = 0, y = 20 }: PageRevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

type StaggerRevealProps = {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
};

/** Conteneur qui révèle ses enfants en cascade au chargement. */
export function StaggerReveal({ children, className, stagger = 0.08 }: StaggerRevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            {child}
          </motion.div>
        ) : (
          child
        ),
      )}
    </motion.div>
  );
}
