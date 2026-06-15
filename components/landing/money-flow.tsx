"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Coins, Users } from "lucide-react";

const MEMBERS = [
  { initials: "AK", color: "#006b2c" },
  { initials: "FD", color: "#4059aa" },
  { initials: "MK", color: "#a72d51" },
  { initials: "SF", color: "#00873a" },
  { initials: "IB", color: "#264191" },
  { initials: "NT", color: "#c74668" },
];

/**
 * Animation 2D : l'argent (pièces) circule en cercle entre les membres
 * d'un groupe autour d'un pot commun central. Illustre la solidarité tournante.
 */
export function MoneyFlow({ potLabel = "Pot commun" }: { potLabel?: string }) {
  const reduce = useReducedMotion();
  const radius = 42; // en % du conteneur

  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm">
      {/* Cercle pointillé de circulation */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#bdcaba"
          strokeWidth="0.6"
          strokeDasharray="2 2"
        />
      </svg>

      {/* Pièces qui tournent le long du cercle */}
      {!reduce && (
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 14, ease: "linear", repeat: Infinity }}
        >
          {[0, 1, 2].map((i) => {
            const angle = (i / 3) * Math.PI * 2;
            const x = 50 + Math.cos(angle) * radius;
            const y = 50 + Math.sin(angle) * radius;
            return (
              <div
                key={i}
                className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-warning shadow-lg ring-2 ring-white"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <Coins className="h-3.5 w-3.5 text-white" />
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Membres autour du cercle */}
      {MEMBERS.map((m, i) => {
        const angle = (i / MEMBERS.length) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;
        return (
          <motion.div
            key={m.initials}
            className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md"
            style={{ left: `${x}%`, top: `${y}%`, backgroundColor: m.color }}
            animate={reduce ? undefined : { scale: [1, 1.12, 1] }}
            transition={
              reduce
                ? undefined
                : { duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }
            }
          >
            {m.initials}
          </motion.div>
        );
      })}

      {/* Pot commun central */}
      <motion.div
        className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-2xl bg-primary text-white shadow-ambient"
        animate={reduce ? undefined : { y: [0, -4, 0] }}
        transition={reduce ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Users className="h-6 w-6" />
        <span className="px-1 text-center font-heading text-[10px] font-semibold leading-none">{potLabel}</span>
      </motion.div>
    </div>
  );
}
