
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/valeda/',
  locale: undefined,
  routes: undefined,
  entryPointToBrowserMapping: {},
  assets: {
    'index.csr.html': {size: 2543, hash: '0fe3b8dc09531989d0283ebe0a3b29d7e99e6b41c329ac9b166b393979378e83', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1048, hash: '7a854818e963815d43949ba3126651f51f601c9f69f9244735e05b3a482090d9', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-5JHKKTCZ.css': {size: 55955, hash: '8vJ1TOyxUdQ', text: () => import('./assets-chunks/styles-5JHKKTCZ_css.mjs').then(m => m.default)}
  },
};
