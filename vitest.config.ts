import path from "node:path";
import { defineConfig } from "vitest/config";

// Aligne vitest sur l'alias "@/..." du tsconfig.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
