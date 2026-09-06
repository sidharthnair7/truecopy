"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function GateRuleCard({
  title,
  before,
  after,
}: {
  title: string;
  before: string;
  after: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`glass glass--t2 glass-lift p-5 cursor-default ${
        hovered ? "glass--refused" : ""
      }`}
      transition={{
        layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
      }}
    >
      <motion.h3
        layout="position"
        className="text-sm font-medium text-grey-100 mb-3 flex items-center gap-2"
      >
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
            hovered ? "bg-t-red" : "bg-t-green"
          }`}
        />
        {title}
      </motion.h3>

      {/* Always show source token */}
      <motion.div layout="position" className="mb-1">
        <span className="text-[10px] uppercase tracking-wider text-grey-400">
          Source
        </span>
        <p className="text-xs text-t-green font-mono mt-0.5">{before}</p>
      </motion.div>

      {/* Corrupted token on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-2 border-t border-grey-800 mt-2">
              <span className="text-[10px] uppercase tracking-wider text-grey-400">
                Mutation detected
              </span>
              <p className="text-xs text-t-red font-mono line-through mt-0.5">
                {after}
              </p>
              <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-t-red/15 text-t-red font-medium border border-t-red/20">
                REFUSED
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
