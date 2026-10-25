/* What the Smash service worker: network first, so every update arrives straight away.
   A saved copy of the app is only used when the phone is offline. */
var CACHE = "wts-v1";
self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request; if (r.method !== "GET") return;
  var u = new URL(r.url); if (u.origin !== self.location.origin) return;
  var page = r.mode === "navigate";
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok && (page || /\.(png|json)$/.test(u.pathname))) { var c = res.clone(); caches.open(CACHE).then(function (ca) { ca.put(page ? "./" : r, c); }); }
    return res;
  }).catch(function () { return caches.match(page ? "./" : r).then(function (m) { return m || Response.error(); }); }));
});
/* Tapping a notification opens the right place in the app (used once notifications are switched on) */
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var link = (e.notification.data && e.notification.data.link) || "/#home";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if ("focus" in cs[i]) { cs[i].navigate(link).catch(function () {}); return cs[i].focus(); } }
    return self.clients.openWindow(link);
  }));
});
