// app.config.ts
import { defineConfig } from "@tanstack/start/config";
import tsConfigPaths from "vite-tsconfig-paths";
var app_config_default = defineConfig({
  // ----------------------------------------------------------------------------
  // Vite Configuration
  // ----------------------------------------------------------------------------
  // TanStack Start uses Vite under the hood for fast development and builds.
  // We can pass Vite plugins and configuration here.
  // ----------------------------------------------------------------------------
  vite: {
    plugins: [
      // Enables TypeScript path aliases (e.g., @/components -> src/components)
      // This reads from tsconfig.json's "paths" configuration
      tsConfigPaths({
        projects: ["./tsconfig.json"]
      })
    ]
  }
});
export {
  app_config_default as default
};
