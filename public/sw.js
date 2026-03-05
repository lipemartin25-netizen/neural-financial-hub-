const CACHE_NAME = 'neuralfinance-v1'
const STATIC_ASSETS = [
    '/dashboard',
    '/transactions',
    '/boletos',
    '/accounts',
    '/offline',
]

// Install — cache estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(() => {
                // Ignora falhas individuais
                return Promise.allSettled(
                    STATIC_ASSETS.map(url => cache.add(url).catch(() => { }))
                )
            })
        })
    )
    self.skipWaiting()
})

// Activate — limpar caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        })
    )
    self.clients.claim()
})

// Fetch — Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event

    // Ignorar requisições não-GET
    if (request.method !== 'GET') return

    // Ignorar APIs — sempre network
    if (request.url.includes('/api/')) return

    // Ignorar auth callbacks
    if (request.url.includes('/auth/')) return

    // Ignorar extensões de dev
    if (request.url.includes('_next/webpack-hmr')) return

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clonar e cachear resposta válida
                if (response.ok && response.type === 'basic') {
                    const responseClone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone)
                    })
                }
                return response
            })
            .catch(() => {
                // Offline — tentar cache
                return caches.match(request).then((cached) => {
                    if (cached) return cached

                    // Se for navegação, mostrar página offline
                    if (request.mode === 'navigate') {
                        return caches.match('/offline').then((offlinePage) => {
                            return offlinePage || new Response(
                                '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Neural Finance Hub — Offline</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0d10;color:#ebe6da;font-family:system-ui}div{text-align:center;padding:40px}h1{font-size:24px;margin-bottom:8px}p{color:#9ca3af;font-size:14px}button{margin-top:24px;padding:12px 24px;background:linear-gradient(135deg,#c9a858,#b8943f);border:none;border-radius:10px;color:#0b0d10;font-weight:600;cursor:pointer;font-size:14px}</style></head><body><div><h1>📡 Sem Conexão</h1><p>Verifique sua internet e tente novamente</p><button onclick="location.reload()">Tentar Novamente</button></div></body></html>',
                                { headers: { 'Content-Type': 'text/html' } }
                            )
                        })
                    }
                    return new Response('', { status: 408 })
                })
            })
    )
})

// Push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return
    const data = event.data.json()
    event.waitUntil(
        self.registration.showNotification(data.title || 'Neural Finance Hub', {
            body: data.body || '',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: data.tag || 'default',
            data: { url: data.url || '/dashboard' },
        })
    )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = event.notification.data?.url || '/dashboard'
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            for (const client of clients) {
                if (client.url.includes(url) && 'focus' in client) return client.focus()
            }
            return self.clients.openWindow(url)
        })
    )
})
