/* What the Smash service worker: network first, so every update arrives straight away.
   A saved copy of the app is only used when the phone is offline. */
var CACHE = "wts-v3";
/* Tapping a notification opens the right place in the app. Registered first, so it wins over Firebase's own handler.
   Messages sent from the Firebase console carry a "link" label: rsvp, home, live or results */
self.addEventListener("notificationclick", function (e) {
  var d = (e.notification && e.notification.data) || {}, f = d.FCM_MSG || {}, raw = d.link || (f.data && f.data.link) || (f.fcmOptions && f.fcmOptions.link) || "home";
  raw = String(raw).trim();
  var link = /^https?:/.test(raw) ? raw : "/#" + raw.replace(/^[\/#]+/, "");
  e.stopImmediatePropagation(); e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if ("focus" in cs[i]) { cs[i].navigate(link).catch(function () {}); return cs[i].focus(); } }
    return self.clients.openWindow(link);
  }));
});

/* notifications: Firebase Cloud Messaging shows them while the app is closed */
try {
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js", "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
  firebase.initializeApp({ apiKey: "AIzaSyA5nE_EeI6AzMrzE-FIn8Utczin-iJ6BfE", authDomain: "what-the-smash-c08a3.firebaseapp.com", projectId: "what-the-smash-c08a3", storageBucket: "what-the-smash-c08a3.firebasestorage.app", messagingSenderId: "884712885649", appId: "1:884712885649:web:41bdae7a99c0abb8c61e30" });
  firebase.messaging().onBackgroundMessage(function (p) {
    if (p && p.notification) return; /* sent from the Firebase console: Firebase shows it itself */
    var d = (p && p.data) || {};
    return self.registration.showNotification(d.title || "What the Smash", { body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.tag || undefined, data: { link: d.link || "/#home" } });
  });
} catch (e) {}
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
