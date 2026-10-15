import { DocumentsApiClient, DocumentItem } from '../api/documents';

/**
 * Fila offline e cache local para o PWA (armazenamento persistido no navegador).
 * Garante resiliência quando o usuário está sem conexão de rede.
 */

export interface OfflineDocumentPayload {
  fileName: string;
  fileBase64: string;
  mimeType: string;
  sectorId?: string;
}

export interface OfflineQueueItem {
  id: string;
  action: 'upload_document' | 'update_sector';
  payload: any;
  createdAt: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

const STORAGE_KEY = 'neurafin_offline_queue';

export class OfflineSyncManager {
  static getPendingQueue(): OfflineQueueItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static enqueue(action: 'upload_document' | 'update_sector', payload: any): OfflineQueueItem {
    const queue = this.getPendingQueue();
    const item: OfflineQueueItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      action,
      payload,
      createdAt: Date.now(),
      status: 'pending',
    };
    queue.push(item);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      } catch (e) {
        console.warn('Falha ao gravar fila offline no localStorage:', e);
      }
    }
    return item;
  }

  static markSynced(id: string) {
    const queue = this.getPendingQueue().filter((item) => item.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    }
  }

  static markFailed(id: string, error: string) {
    const queue = this.getPendingQueue().map((item) => {
      if (item.id === id) {
        return { ...item, status: 'failed' as const, error };
      }
      return item;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    }
  }

  static clearQueue() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Sincroniza itens pendentes na fila utilizando o cliente de API.
   */
  static async syncQueue(client: DocumentsApiClient): Promise<{ synced: number; failed: number }> {
    const queue = this.getPendingQueue().filter((i) => i.status === 'pending' || i.status === 'failed');
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        if (item.action === 'upload_document') {
          const payload = item.payload as OfflineDocumentPayload;
          // Converte Base64 de volta para File/Blob
          const byteCharacters = atob(payload.fileBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: payload.mimeType });
          const file = new File([blob], payload.fileName, { type: payload.mimeType });

          await client.uploadDocument(file, payload.sectorId);
          this.markSynced(item.id);
          synced++;
        } else if (item.action === 'update_sector') {
          await client.updateDocumentSector(item.payload.documentId, item.payload.sectorId);
          this.markSynced(item.id);
          synced++;
        }
      } catch (err: any) {
        this.markFailed(item.id, err.message || 'Falha desconhecida na sincronização');
        failed++;
      }
    }

    return { synced, failed };
  }
}
