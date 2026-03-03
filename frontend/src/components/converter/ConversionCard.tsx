"use client";

// src/components/converter/ConversionCard.tsx
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ConversionOption } from "@/types";
import { cn } from "@/lib/utils";

interface ConversionCardProps {
  option: ConversionOption;
  onClick: () => void;
}

export default function ConversionCard({ option, onClick }: ConversionCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative text-left rounded-2xl p-5 border border-white/10",
        "bg-white/5 hover:bg-white/10 transition-all duration-200",
        "overflow-hidden cursor-pointer w-full"
      )}
    >
      {/* Gradient blob background */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br",
          option.color
        )}
      />

      {/* Icon */}
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-4",
          "bg-gradient-to-br shadow-lg",
          option.color
        )}
      >
        {option.icon}
      </div>

      {/* Text */}
      <p className="text-white font-bold text-base mb-1 group-hover:text-white transition-colors">
        {option.label}
      </p>
      <p className="text-white/45 text-xs leading-relaxed line-clamp-2">
        {option.description}
      </p>

      {/* Arrow */}
      <div className="mt-3 flex items-center gap-1 text-white/30 group-hover:text-white/70 transition-colors">
        <span className="text-xs font-mono">Mulai</span>
        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  );
}
