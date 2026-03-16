/* ═══════════════════════════════════════════════════════════
   MUSCLE MAP PRO — Service Worker
   版本更新：只需修改 config.js 里的 version，
   此文件的 CACHE_VERSION 会在注册时由 index.html 传入
═══════════════════════════════════════════════════════════ */

/* 缓存名称由注册时传入的版本号决定，版本变化时自动更新缓存 */
let CACHE_NAME = 'mmp-v1.2.7';

/* 需要缓存的文件列表 */
const CACHE_FILES = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './config.js',
  './videos.json',
  './manifest.json',
  './favicon.ico',
  './icon-32.png',
  './icon-96.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];

/* ── 安装：缓存所有静态文件 ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())  // 立即激活，不等旧版本关闭
  );
});

/* ── 激活：清理旧版本缓存 ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())  // 立即接管所有标签页
  );
});

/* ── 拦截请求：Cache First 策略 ── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Firebase / Google / CDN 请求不缓存，直接走网络 */
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('cdnjs') ||
    url.hostname.includes('youtube') ||
    url.hostname.includes('bilibili') ||
    url.hostname.includes('v.qq.com')
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  /* 本地文件：Cache First，缓存有就直接返回，没有再请求网络并缓存 */
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        /* 只缓存成功的 GET 请求 */
        if (!response || response.status !== 200 || event.request.method !== 'GET') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      }).catch(() => {
        /* 离线且缓存也没有：返回 index.html 兜底（SPA 路由用） */
        return caches.match('./index.html');
      });
    })
  );
});

/* ── 接收版本号消息（由 index.html 注册时发送） ── */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SET_VERSION') {
    CACHE_NAME = 'mmp-' + event.data.version;
  }
});
