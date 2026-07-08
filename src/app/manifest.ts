import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgroNex",
    short_name: "AgroNex",
    description: "Sistema de productividad agrícola para registrar avances por cuadrilla, sector y cultivo.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#164c37",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/agronex-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/agronex-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/agronex-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
