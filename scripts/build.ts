import { execSync } from 'child_process';
import { build } from 'esbuild';

// execSync("pnpm build:turbo", { stdio: "inherit" });

build({
  entryPoints: ['main.ts'],
  bundle: true,
  outfile: 'dist/main.js',
  platform: 'node', // or 'browser' if targeting browser
  sourcemap: true,
  target: ['esnext'],
}).catch(() => process.exit(1));
