"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "5493413000000"; // reemplazar con número real
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%2C%20me%20gustar%C3%ADa%20consultar%20sobre%20sus%20productos%20%F0%9F%8E%82`;

const categories = [
  { label: "Mesas Dulces", emoji: "🍭", href: "/productos?cat=mesas-dulces" },
  { label: "Tortas",       emoji: "🎂", href: "/productos?cat=tortas" },
  { label: "Cake Pops",    emoji: "🍡", href: "/productos?cat=cake-pops" },
  { label: "Clases",       emoji: "👩‍🍳", href: "/productos?cat=clases" },
];

const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  },
});

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background px-4">

      {/* Decorative blobs — brand gradient colors, blurred */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.42 0.18 355), oklch(0.58 0.17 18))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.72 0.14 65), oklch(0.58 0.17 18))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full opacity-15 blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.94 0.025 355), transparent)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* Script brand name */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp(0)}
          className="font-script text-5xl md:text-6xl lg:text-7xl gradient-brand-text mb-4 leading-tight"
        >
          La Patisserie
        </motion.p>

        {/* Main headline */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp(0.15)}
          className="font-heading text-3xl md:text-5xl lg:text-6xl text-foreground leading-tight text-balance mb-6"
        >
          Dulces únicos para{" "}
          <span className="gradient-brand-text">momentos</span>
          {" "}que no se repiten
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp(0.3)}
          className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 text-balance"
        >
          Mesas dulces, tortas y pastelería artesanal 100% personalizada
          para cumpleaños y eventos especiales en Rosario.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp(0.45)}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
        >
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: "lg" }),
              "gradient-brand text-white border-0 hover:opacity-90 transition-opacity shadow-md text-base px-8"
            )}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Consultanos por WhatsApp
          </a>
          <Link
            href="/productos"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "text-base px-8 hover:text-primary hover:border-primary transition-colors"
            )}
          >
            Ver productos
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </motion.div>

        {/* Quick category pills */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp(0.6)}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-accent transition-all duration-200 shadow-sm"
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </Link>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <span className="text-xs text-muted-foreground tracking-widest uppercase">
          Explorar
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-muted-foreground/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}
