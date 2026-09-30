/* 大永劫 · Service Worker
 * 只在通过 http(s) 打开时注册（file:// 下浏览器不允许注册）。
 * 作用：把应用外壳缓存下来，第二次打开就不需要电脑开着，也不需要网络。
 */
var CACHE = 'dayongjie-v3-2';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // 逐个加，任何一个 404 都不该让整份缓存失败
      return Promise.all(ASSETS.map(function (u) {
        return c.add(u).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
        return res;
      }).catch(function () {
        // 离线且没缓存 → 至少把外壳给出去
        return caches.match('./index.html');
      });
    })
  );
});
