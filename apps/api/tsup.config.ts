import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  dts: true,
  clean: true,
  noExternal: ['@fixlocal/shared'],
});
