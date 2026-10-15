const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface Sector {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type DocumentStatus =
  | 'received'
  | 'pending_processing'
  | 'processing'
  | 'ready'
  | 'review_required'
  | 'read_unavailable'
  | 'error'
  | 'pending_sync';

export interface DocumentItem {
  id: string;
  user_id: string;
  sector_id: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  suggested_sector_id: string | null;
  confidence_score: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export class DocumentsApiClient {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl: string = API_BASE_URL) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  static async requestAuthToken(email: string, baseUrl: string = API_BASE_URL): Promise<{ access_token: string; user_id: string; email: string }> {
    const res = await fetch(`${baseUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Falha na autenticação (HTTP ${res.status}): ${errText}`);
    }

    return res.json();
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  async getSectors(): Promise<Sector[]> {
    const res = await fetch(`${this.baseUrl}/documents/sectors`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Falha ao buscar setores (HTTP ${res.status})`);
    }
    return res.json();
  }

  async createSector(name: string, color: string = '#c9a858'): Promise<Sector> {
    const res = await fetch(`${this.baseUrl}/documents/sectors`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, color, is_default: false }),
    });
    if (!res.ok) {
      throw new Error(`Falha ao criar setor (HTTP ${res.status})`);
    }
    return res.json();
  }

  async getDocuments(sectorId?: string, status?: DocumentStatus): Promise<DocumentItem[]> {
    const url = new URL(`${this.baseUrl}/documents`);
    if (sectorId) {
      url.searchParams.append('sector_id', sectorId);
    }
    if (status) {
      url.searchParams.append('doc_status', status);
    }
    const res = await fetch(url.toString(), {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Falha ao listar documentos (HTTP ${res.status})`);
    }
    return res.json();
  }

  async uploadDocument(file: File, sectorId?: string): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (sectorId) {
      formData.append('sector_id', sectorId);
    }

    const res = await fetch(`${this.baseUrl}/documents/upload`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    });

    if (res.status !== 202) {
      const errText = await res.text();
      throw new Error(`Falha no upload (HTTP ${res.status}): ${errText}`);
    }

    return res.json();
  }

  async updateDocumentSector(documentId: string, sectorId: string): Promise<DocumentItem> {
    const res = await fetch(`${this.baseUrl}/documents/${documentId}/sector`, {
      method: 'PATCH',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sector_id: sectorId }),
    });

    if (!res.ok) {
      throw new Error(`Falha ao atualizar setor do documento (HTTP ${res.status})`);
    }

    return res.json();
  }

  async processPendingJobs(): Promise<{ status: string; processed_jobs: number; message: string }> {
    const res = await fetch(`${this.baseUrl}/documents/process-jobs`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Falha ao processar jobs (HTTP ${res.status})`);
    }

    return res.json();
  }

  getDownloadUrl(documentId: string): string {
    return `${this.baseUrl}/documents/${documentId}/download`;
  }

  async downloadDocumentBlob(documentId: string): Promise<{ blob: Blob; fileName: string }> {
    const res = await fetch(this.getDownloadUrl(documentId), {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Falha ao baixar arquivo (HTTP ${res.status})`);
    }

    // Extrai nome do cabeçalho Content-Disposition se disponível
    const disposition = res.headers.get('content-disposition');
    let fileName = `documento_${documentId}`;
    if (disposition && disposition.includes('filename="')) {
      fileName = disposition.split('filename="')[1].split('"')[0];
    }

    const blob = await res.blob();
    return { blob, fileName };
  }
}
