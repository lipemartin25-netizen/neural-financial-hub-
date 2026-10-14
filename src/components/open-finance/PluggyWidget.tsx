'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Building2, AlertCircle } from 'lucide-react'
import { C, btnGoldStyle } from '@/lib/theme'

interface PluggyWidgetProps {
  onSuccess?: (itemId: string, connectorName: string, connectorLogo?: string) => void
  onError?: (error: Error) => void
  buttonLabel?: string
}

export function PluggyWidget({ onSuccess, onError, buttonLabel = 'Conectar Banco' }: PluggyWidgetProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openWidget = useCallback(async () => {
    setLoading(true)
    setError(null)
    console.log('[PluggyWidget] Iniciando fluxo de conexão...')

    try {
      console.log('[PluggyWidget] Passo 1: Solicitando token de API...')
      const response = await fetch('/api/open-finance?action=connect_token')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(errorData.error || 'Erro ao conectar com servidor')
      }

      const data = await response.json()
      console.log('[PluggyWidget] Passo 2: Token recebido:', { success: !!data.connectToken, demo: !!data.demo })

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.demo) {
        console.log('[PluggyWidget] Modo Demo: Simulando conexão em 2 segundos...')
        setTimeout(async () => {
          const mockItemId = `mock-item-${Date.now()}`
          const mockConnector = { name: 'Nubank (Simulado)', logo: 'https://dashboard.pluggy.ai/favicons/favicon-32x32.png' }
          
          try {
            await fetch('/api/open-finance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'save_connection',
                itemId: mockItemId,
                connectorName: mockConnector.name,
                connectorLogo: mockConnector.logo
              })
            })
            onSuccess?.(mockItemId, mockConnector.name, mockConnector.logo)
          } catch (err) {
            console.error('[PluggyWidget] Erro ao salvar conexão mock:', err)
          } finally {
            setLoading(false)
          }
        }, 2000)
        return
      }

      const connectToken = data.connectToken
      if (!connectToken) {
        throw new Error('Servidor não retornou um Token válido (AccessToken vazio)')
      }

      console.log('[PluggyWidget] Passo 3: Iniciando SDK...')

      // 2. Carregar o SDK do Pluggy dinamicamente se necessário
      if (!(window as any).PluggyConnect) {
        console.log('[PluggyWidget] Carregando script externo do CDN...')
        await loadPluggyScript()
      }

      // 3. Inicializar o widget COM o token
      console.log('[PluggyWidget] Renderizando widget...')
      
      const pluggyConnect = new (window as any).PluggyConnect({
        connectToken: connectToken, // Passando o token corretamente
        includeSandbox: true, // Habilitar sandbox para testes
        onSuccess: async (sdkData: any) => {
          console.log('[PluggyWidget] Conexão bem-sucedida no SDK:', sdkData)
          
          const itemId = sdkData.item?.id || sdkData.itemId
          const connectorName = sdkData.item?.connector?.name || sdkData.connector?.name || 'Banco'
          const connectorLogo = sdkData.item?.connector?.imageUrl || sdkData.connector?.imageUrl
          
          if (itemId) {
            // Salvar no nosso backend antes de notificar sucesso
            try {
                await fetch('/api/open-finance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'save_connection',
                        itemId,
                        connectorName,
                        connectorLogo
                    })
                })
                onSuccess?.(itemId, connectorName, connectorLogo)
            } catch (saveErr) {
                console.error('[PluggyWidget] Erro ao salvar conexão no DB:', saveErr)
            }
          }
        },
        onError: (sdkError: any) => {
          console.error('[PluggyWidget] Erro retornado pelo SDK:', sdkError)
          setError(sdkError.message || 'Erro na interface do Pluggy')
          onError?.(sdkError)
        },
        onClose: () => {
          console.log('[PluggyWidget] Widget fechado pelo usuário')
          setLoading(false)
        },
      })

      pluggyConnect.init()
      
    } catch (err: any) {
      console.error('[PluggyWidget] Erro fatal no componente:', err)
      setError(err.message || 'Falha ao processar conexão')
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [onSuccess, onError])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {error && (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8, color: C.red, fontSize: 13,
            backgroundColor: 'rgba(248,113,113,0.1)', padding: '8px 16px', borderRadius: 8,
            border: `1px solid rgba(248,113,113,0.2)`
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      
      <button
        onClick={openWidget}
        disabled={loading}
        style={{
            ...btnGoldStyle,
            opacity: loading ? 0.7 : 1,
            minWidth: 180
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <Building2 size={16} />
            {buttonLabel}
          </>
        )}
      </button>
      <style jsx>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// Helper para carregar o script com retry/check
function loadPluggyScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).PluggyConnect) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.pluggy.ai/pluggy-connect/latest/pluggy-connect.js'
    script.async = true
    script.id = 'pluggy-connect-sdk'
    
    script.onload = () => {
      console.log('[PluggyWidget] Script da Pluggy carregado com sucesso')
      resolve()
    }
    
    script.onerror = () => {
      console.error('[PluggyWidget] Falha crítica ao carregar script do CDN')
      reject(new Error('Não foi possível carregar o componente do Pluggy pela rede'))
    }
    
    document.head.appendChild(script)
  })
}
