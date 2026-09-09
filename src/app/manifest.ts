import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La Patisserie",
    short_name: "La Patisserie",
    description: "Gestión de recetas, costos, pedidos y producción — La Patisserie.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#FEFCF9",
    theme_color: "#FEFCF9",
    lang: "es-AR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
