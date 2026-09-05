importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_NAME = 'lomedx-pro-v1'; // إصدار احترافي
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/supabase.js',
  './manifest.json'
];

// 1. التثبيت: تخزين الواجهة الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting(); // تجهيز النسخة الجديدة في الخلفية
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

// 3. استراتيجية الفصل الذكي (العبقرية هنا)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // أ) تجاهل تام لطلبات Supabase و OneSignal (لتبقى الدردشة والحجوزات حية ولا تتعلق)
  if (url.hostname.includes('supabase.co') || url.hostname.includes('onesignal.com')) {
    return; 
  }

  // ب) استراتيجية (الشبكة أو الكاش مع التحديث بالخلفية) للملفات الأساسية
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      // أرجع الملف من الكاش فوراً (للمستخدم السريع)، ثم حدثه من السيرفر بالخلفية
      const fetchPromise = fetch(req).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes.clone()));
        }
        return networkRes;
      }).catch(() => cachedRes); // إذا انقطع النت، استخدم الكاش
      
      return cachedRes || fetchPromise;
    })
  );
});

// 4. استقبال أمر التحديث من المستخدم
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
