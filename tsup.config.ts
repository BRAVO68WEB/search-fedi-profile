import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    cli: "src/cli/index.ts",
    "core/resolver": "src/core/resolver.ts",
    "core/types": "src/core/types.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  banner: {
    js: "",
  },
});
