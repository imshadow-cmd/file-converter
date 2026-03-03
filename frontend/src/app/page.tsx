"use client";

// src/app/page.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Image, FileStack, Github } from "lucide-react";
import { CONVERSIONS } from "@/lib/conversions";
import { ConversionOption, ConversionCategory } from "@/types";
import ConversionCard from "@/components/converter/ConversionCard";
import ConverterModal from "@/components/converter/ConverterModal";

const CATEGORIES: { id: ConversionCategory | "all"; label: string; icon: React.ReactNode }[] = [
  { id: "all",      label: "Semua",   icon: "🔮" },
  { id: "document", label: "Dokumen", icon: <FileText  className="w-4 h-4" /> },
  { id: "image",    label: "Gambar",  icon: <Image     className="w-4 h-4" /> },
  { id: "pdf",      label: "PDF",     icon: <FileStack className="w-4 h-4" /> },
];

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<ConversionCategory | "all">("all");
  const [activeOption, setActiveOption] = useState<ConversionOption | null>(null);

  const filtered = activeCategory === "all"
    ? CONVERSIONS
    : CONVERSIONS.filter((c) => c.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-20 border-b border-white/5 backdrop-blur-xl bg-gray-950/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-sm">
              X
            </div>
            <span className="font-bold text-lg tracking-tight">
              File<span className="text-blue-400">Converter</span>
            </span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-300 text-sm mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            All-in-One File Converter
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-5 leading-tight">
            Konversi File
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Semudah Satu Klik
            </span>
          </h1>

          <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
            Ubah dokumen, gambar, dan PDF dengan cepat. Gratis, aman, dan
            tidak perlu registrasi. Semua format dalam satu tempat.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-8 mt-10"
        >
          {[
            { label: "Format Didukung", value: "10+" },
            { label: "Batas Ukuran",    value: "50 MB" },
            { label: "Waktu Proses",    value: "< 30 dtk" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-white/40 text-sm mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Main Content ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center sm:justify-start">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeCategory === cat.id
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              {typeof cat.icon === "string" ? cat.icon : cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Conversion grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            variants={CONTAINER}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((option) => (
              <motion.div key={option.id} variants={ITEM}>
                <ConversionCard
                  option={option}
                  onClick={() => setActiveOption(option)}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── How It Works ── */}
      <section className="border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-black tracking-tight mb-12">Cara Kerja</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Pilih Format",  desc: "Pilih jenis konversi yang Anda butuhkan dari grid di atas", icon: "🎯" },
              { step: "02", title: "Upload File",   desc: "Seret & lepas file atau klik untuk memilih dari komputer Anda", icon: "⬆️" },
              { step: "03", title: "Unduh Hasil",   desc: "Klik unduh setelah konversi selesai. File tersimpan otomatis", icon: "⬇️" },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl mb-4">
                  {s.icon}
                </div>
                <div className="text-xs font-mono text-blue-400 mb-2">{s.step}</div>
                <h3 className="text-white font-bold mb-2">{s.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            © 2024 FileConverter. Semua file diproses secara lokal.
          </p>
          <p className="text-white/20 text-xs">
            Dibangun dengan Next.js + FastAPI
          </p>
        </div>
      </footer>

      {/* ── Converter Modal ── */}
      <AnimatePresence>
        {activeOption && (
          <ConverterModal
            option={activeOption}
            onClose={() => setActiveOption(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
