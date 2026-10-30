const CACHE_NAME = 'neuralfinance-v2'
const STATIC_ASSETS = [
    '/offline',
    '/favicon.ico',
    '/manifest.json'
]

// Install — cache estáticos essenciais não sensíveis
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
                STATIC_ASSETS.map(url => cache.add(url).catch(() => { }))
            )
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

// Limpeza de cache disparada pelo cliente no logout com confirmação
self.addEventListener('message', (event) => {
    if (event.data && (event.data.action === 'CLEAR_AUTH_CACHE' || event.data.action === 'LOGOUT')) {
        event.waitUntil(
            caches.keys().then((keys) => {
                return Promise.all(keys.map(k => caches.delete(k)))
            }).then(() => {
                if (event.ports && event.ports[0]) {
                    event.ports[0].postMessage({ status: 'done' })
                }
            })
        )
    }
})

// Fetch — Network first para navegações, cache somente para ativos estáticos imutáveis
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = request.url

    // Ignorar requisições não-GET
    if (request.method !== 'GET') return

    // Ignorar APIs — sempre network
    if (url.includes('/api/')) return

    // Ignorar auth callbacks
    if (url.includes('/auth/')) return

    // Ignorar payloads do React Server Components (_rsc) para evitar cache de dados dinâmicos
    if (url.includes('_rsc=') || url.includes('.rsc')) return

    // Ignorar extensões de dev
    if (url.includes('_next/webpack-hmr')) return

    // Se for navegação de página HTML: NUNCA salvar HTML autenticado no cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match('/offline').then((offlinePage) => {
                    return offlinePage || new Response(
                        '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Neural Finance Hub — Offline</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0d10;color:#ebe6da;font-family:system-ui}div{text-align:center;padding:40px}h1{font-size:24px;margin-bottom:8px}p{color:#9ca3af;font-size:14px}button{margin-top:24px;padding:12px 24px;background:linear-gradient(135deg,#c9a858,#b8943f);border:none;border-radius:10px;color:#0b0d10;font-weight:600;cursor:pointer;font-size:14px}</style></head><body><div><h1>📡 Sem Conexão</h1><p>Verifique sua internet e tente novamente</p><button onclick="location.reload()">Tentar Novamente</button></div></body></html>',
                        { headers: { 'Content-Type': 'text/html' } }
                    )
                })
            })
        )
        return
    }

    // Apenas ativos estáticos imutáveis são cacheados (JS estático empacotado, CSS, imagens, fontes)
    const isStaticAsset = (url.includes('/_next/static/') ||
        url.includes('/icons/') ||
        url.includes('/fonts/') ||
        /\.(css|js|woff2|woff|ttf|png|svg|jpg|jpeg|webp|ico)$/i.test(url)) &&
        !url.includes('_rsc=')

    if (isStaticAsset) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached

                return fetch(request).then((response) => {
                    if (response.ok && response.type === 'basic') {
                        const responseClone = response.clone()
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone)
                        })
                    }
                    return response
                }).catch(() => new Response('', { status: 408 }))
            })
        )
        return
    }

    // Demais requisições: fetch padrão pela rede
    event.respondWith(fetch(request).catch(() => new Response('', { status: 408 })))
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
