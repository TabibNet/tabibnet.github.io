importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_NAME = 'lomedx-pro-v3'; // كاشش
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/supabase.js',
  './manifest.json'
];

// 1. التثبيت: تخزين الواجهة الأساسية (بدون skipWaiting)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  // تم إزالة self.skipWaiting() من هنا لنسمح بظهور رسالة التحديث
});

// 2. التفعيل: مسح النسخ القديمة فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && !cacheName.includes('onesignal')) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. استراتيجية الفصل الذكي
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.hostname.includes('supabase.co') || url.hostname.includes('onesignal.com')) {
    return; 
  }

  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes.clone()));
        }
        return networkRes;
      }).catch(() => cachedRes);
      
      return cachedRes || fetchPromise;
    })
  );
});

// 4. استقبال أمر التحديث من المستخدم (هنا يكمن الحل)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting(); // لا يتم التفعيل إلا عندما يضغط المستخدم على زر التحديث
  }
});
