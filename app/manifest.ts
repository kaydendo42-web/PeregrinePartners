import type { MetadataRoute } from "next";

/**
 * PeregrineOffice, installable from the browser to a phone or tablet home
 * screen. It opens on the console: the proxy sends a signed-out visitor to
 * sign-in first, so one start URL serves both. The scope is the whole site so
 * sign-in, two-step and email links stay inside the app window.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/console",
    name: "PeregrineOffice",
    short_name: "PeregrineOffice",
    description: "Your venue's bookings, tables and customers, from Peregrine Partners.",
    start_url: "/console",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#1a1a1a",
    theme_color: "#1a1a1a",
    icons: [
      { src: "/app/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
