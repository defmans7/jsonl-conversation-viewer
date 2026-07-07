/**
 * Production build script.
 *
 * Bundles JS via Bun.build, inlines CSS and JS into index.html,
 * and writes a self-contained dist/index.html.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

// 1. Bundle JS
console.log('[build] bundling JS...');
const result = await Bun.build({
  entrypoints: ['./src/app.js'],
  outdir: './dist',
  target: 'browser',
  minify: true,
  naming: '[dir]/bundle.[ext]',
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const bundledJs = await Bun.file('./dist/bundle.js').text();
console.log(`[build] JS bundle: ${(bundledJs.length / 1024).toFixed(1)} kB`);

// 2. Read CSS
const css = readFileSync('./src/styles/main.css', 'utf-8');
console.log(`[build] CSS: ${(css.length / 1024).toFixed(1)} kB`);

// 3. Read HTML template
let html = readFileSync('./src/index.html', 'utf-8');

// 4. Inline CSS (replace the <link> tag)
html = html.replace(
  '<link rel="stylesheet" href="/styles/main.css">',
  `<style>\n${css}\n</style>`
);

// 5. Inline JS (replace the module script tag)
html = html.replace(
  '<script type="module" src="/app.js"></script>',
  `<script>\n${bundledJs}\n</script>`
);

// 6. Write output and clean up leftover bundle
import { unlinkSync } from 'node:fs';
mkdirSync('./dist', { recursive: true });
writeFileSync('./dist/index.html', html);
unlinkSync('./dist/bundle.js');
console.log(`[build] dist/index.html: ${(html.length / 1024).toFixed(1)} kB`);
console.log('[build] done.');
