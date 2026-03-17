const CACHE_NAME = 'startup-team-simulator-v1.0.0';
const STATIC_CACHE_NAME = 'startup-team-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'startup-team-dynamic-v1.0.0';

// 캐시할 정적 리소스들
const STATIC_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/agents.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  'https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nYivN04w.woff2'
];

// 네트워크 우선 캐시할 동적 리소스들
const DYNAMIC_FILES = [
  // 이곳에 API 엔드포인트나 외부 리소스 추가 가능
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker 설치 중...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME)
        .then((cache) => {
          console.log('[SW] 정적 파일 캐싱 중...');
          return cache.addAll(STATIC_FILES);
        }),
      caches.open(DYNAMIC_CACHE_NAME)
        .then((cache) => {
          console.log('[SW] 동적 캐시 초기화 완료');
          return Promise.resolve();
        })
    ])
    .then(() => {
      console.log('[SW] 모든 파일 캐싱 완료');
      return self.skipWaiting(); // 즉시 활성화
    })
    .catch((error) => {
      console.error('[SW] 캐싱 실패:', error);
    })
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker 활성화 중...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 이전 버전 캐시 삭제
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('startup-team-')) {
              console.log('[SW] 이전 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker 활성화 완료');
        return self.clients.claim(); // 모든 클라이언트 제어
      })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // POST 요청은 무시
  if (request.method !== 'GET') {
    return;
  }
  
  // Chrome extension 요청 무시
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }
  
  // 캐시 전략 선택
  if (STATIC_FILES.some(file => request.url.includes(file)) || 
      request.url.includes('googleapis.com') ||
      request.url.includes('gstatic.com')) {
    // 정적 파일: Cache First 전략
    event.respondWith(cacheFirst(request));
  } else if (url.origin === location.origin) {
    // 같은 도메인: Network First 전략
    event.respondWith(networkFirst(request));
  } else {
    // 외부 리소스: Stale While Revalidate 전략
    event.respondWith(staleWhileRevalidate(request));
  }
});

// 캐시 우선 전략 (Cache First)
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] 캐시에서 제공:', request.url);
      return cachedResponse;
    }
    
    // 캐시에 없으면 네트워크에서 가져와서 캐시에 저장
    console.log('[SW] 네트워크에서 가져와서 캐시:', request.url);
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Cache First 에러:', error);
    
    // 오프라인 폴백
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    
    // 기본 오프라인 응답
    return new Response('오프라인 상태입니다.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// 네트워크 우선 전략 (Network First)
async function networkFirst(request) {
  try {
    console.log('[SW] 네트워크 우선 시도:', request.url);
    const response = await fetch(request, { timeout: 3000 });
    
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] 네트워크 실패, 캐시에서 시도:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // HTML 요청이면 메인 페이지 반환
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    
    // 오프라인 응답
    return new Response('리소스를 찾을 수 없습니다.', {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// 지연된 재검증 전략 (Stale While Revalidate)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // 백그라운드에서 새 버전 가져오기
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.warn('[SW] 백그라운드 업데이트 실패:', error);
    });
  
  // 캐시된 버전이 있으면 즉시 반환, 없으면 네트워크 응답 대기
  return cachedResponse || fetchPromise;
}

// 백그라운드 동기화 (지원하는 브라우저에서)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] 백그라운드 동기화 실행');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // 오프라인 중에 저장된 데이터 처리
    console.log('[SW] 백그라운드 동기화 작업 수행');
    // 여기에 오프라인 데이터 동기화 로직 추가
  } catch (error) {
    console.error('[SW] 백그라운드 동기화 실패:', error);
  }
}

// 푸시 알림 (선택적)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다!',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '열기',
        icon: '/icon-96.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icon-96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('스타트업 팀 시뮬레이터', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    // 앱 열기
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// 오프라인 상태 감지
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// 캐시 정리 (주기적 실행)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHES') {
    event.waitUntil(cleanupOldCaches());
  }
});

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name.startsWith('startup-team-') && 
      name !== STATIC_CACHE_NAME && 
      name !== DYNAMIC_CACHE_NAME
    );
    
    await Promise.all(
      oldCaches.map(cacheName => {
        console.log('[SW] 정리 중인 캐시:', cacheName);
        return caches.delete(cacheName);
      })
    );
    
    console.log('[SW] 캐시 정리 완료');
  } catch (error) {
    console.error('[SW] 캐시 정리 실패:', error);
  }
}

console.log('[SW] Service Worker 로드됨 - 버전:', CACHE_NAME);