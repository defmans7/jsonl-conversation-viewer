/**
 * Dev server — serves src/ directly with live-reload injection.
 *
 * Usage: bun run serve.js
 */

const PORT = process.env.PORT || 3000;

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = `./src${path}`;

    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return new Response('Not found', { status: 404 });
    }

    // Inject live-reload snippet into HTML responses
    if (filePath.endsWith('.html')) {
      let html = await file.text();
      html = html.replace('</body>', `<script>
        const ws = new WebSocket('ws://localhost:${PORT}/__livereload');
        ws.onmessage = () => location.reload();
        ws.onclose = () => { setTimeout(() => location.reload(), 1000); };
      </script></body>`);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response(file);
  },
  websocket: {
    open(ws) {
      ws.subscribe('livereload');
    },
  },
});

console.log(`[dev]  http://localhost:${PORT}`);
console.log(`[dev]  serving src/ — edit files and refresh`);
