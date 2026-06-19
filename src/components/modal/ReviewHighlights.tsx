"use client";

import { motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface Review {
  text: string;
  author: string;
}

const REVIEW_HIGHLIGHTS: Review[] = [
  {
    text: "Seonghyeon kombinindeki ceket için Türkiye'deki muadil linki direkt buldum, rehber parasını ilk alışverişte çıkardı.",
    author: "Selin K.",
  },
  {
    text: "Sertifika ve kaynak listesi bir arada gelmesi çok şık. Editöryal düzen, rastgele bir PDF gibi hissettirmiyor.",
    author: "Mert A.",
  },
  {
    text: "Bütçe alternatifleri sayesinde parçaları tek tek aramak yerine doğrudan doğruya stilime uygun seçeneklere ulaştım.",
    author: "Ece D.",
  },
];

export function ReviewHighlights() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.18 }}
      className="mt-10 border-t border-neutral-200 pt-8"
      aria-label="Review highlights"
    >
      <p className="mb-6 text-[9px] tracking-[0.4em] text-neutral-400 uppercase">
        Review Highlights
      </p>

      <div className="space-y-0">
        {REVIEW_HIGHLIGHTS.map((review, index) => (
          <motion.article
            key={review.author}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.24 + index * 0.08 }}
            className={`py-6 ${index > 0 ? "border-t border-neutral-100" : ""}`}
          >
            <p className="font-light text-sm leading-relaxed text-neutral-500">
              {review.text}
              <span className="text-neutral-400"> — {review.author}</span>
            </p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
