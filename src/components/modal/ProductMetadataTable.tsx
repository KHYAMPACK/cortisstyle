"use client";

import { motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface ProductMetadataTableProps {
  pageCount?: number;
}

const METADATA_ROWS = [
  { label: "Format", value: "High-Res Printable PDF" },
  {
    label: "Includes",
    value:
      "1× Certificate of Authenticity + Full Source Links + Budget Alternatives",
  },
  { label: "Delivery", value: "Instant Digital Mailout" },
] as const;

export function ProductMetadataTable({
  pageCount = 2,
}: ProductMetadataTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.08 }}
      className="border border-neutral-200"
    >
      {[...METADATA_ROWS, { label: "Pages", value: `${pageCount} Pages` }].map(
        (row, index, rows) => (
          <div
            key={row.label}
            className={`grid grid-cols-[110px_1fr] gap-4 px-4 py-3 md:grid-cols-[130px_1fr] md:px-5 md:py-3.5 ${
              index < rows.length - 1 ? "border-b border-neutral-200" : ""
            }`}
          >
            <span className="text-[9px] tracking-[0.3em] text-neutral-400 uppercase">
              {row.label}
            </span>
            <span className="text-[11px] leading-relaxed text-neutral-800">
              {row.value}
            </span>
          </div>
        ),
      )}
    </motion.div>
  );
}
