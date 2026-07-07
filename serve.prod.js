/**
 * Production server — serves the built dist/ directory.
 *
 * Usage: bun run serve.prod.js
 */

const PORT = process.env.PORT || 3000;

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = `./dist${path}`;

    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(file, {
      headers: path.endsWith('.html')
        ? { 'Content-Type': 'text/html; charset=utf-8' }
        : {},
    });
  },
});

console.log(`[prod] http://localhost:${PORT}`);
