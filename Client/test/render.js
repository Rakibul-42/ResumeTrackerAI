import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export async function createRenderer() {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
    logLevel: 'error',
  });
  return {
    load: (path) => server.ssrLoadModule(`/src/${path}`),
    render: (Component, props) => renderToStaticMarkup(createElement(Component, props)),
    close: () => server.close(),
  };
}
