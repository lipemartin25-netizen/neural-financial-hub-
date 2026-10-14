import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import crypto from 'crypto';

// Verificação da assinatura do webhook da Pluggy
function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');
    // timingSafeEqual previne ataques de timing
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (err) {
    console.error('[Pluggy Webhook] Erro na verificação de assinatura:', err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient();
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-pluggy-signature') || '';
    const secret = process.env.PLUGGY_WEBHOOK_SECRET;
    
    console.log('[Pluggy Webhook] Evento recebido...');

    // Validação de segurança opcional mas recomendada
    if (secret) {
      const isValid = verifySignature(bodyText, signature, secret);
      if (!isValid) {
        console.warn('[Pluggy Webhook] Assinatura inválida detectada.');
        return NextResponse.json({ error: 'Failing security check' }, { status: 401 });
      }
    } else {
      console.warn('[Pluggy Webhook] WEBHOOK_SECRET não configurado. Prosseguindo sem validação...');
    }

    const payload = JSON.parse(bodyText);
    const { event, data } = payload;
    
    console.log(`[Pluggy Webhook] Processando evento: ${event}`);

    switch (event) {
      case 'item/created':
        console.log('[Pluggy Webhook] Novo item criado:', data.id);
        break;

      case 'item/updated':
        console.log('[Pluggy Webhook] Item atualizado:', data.id, 'Status:', data.status);
        await supabase
          .from('open_finance_connections')
          .update({ 
            status: data.status,
            last_sync_at: new Date().toISOString()
          })
          .eq('item_id', data.id);
        break;

      case 'item/deleted':
        console.log('[Pluggy Webhook] Item removido pelo usuário ou Pluggy:', data.id);
        await supabase
          .from('open_finance_connections')
          .delete()
          .eq('item_id', data.id);
        break;

      case 'transactions/created':
      case 'transactions/updated':
        const itemIdForSync = data.itemId || data.id;
        console.log('[Pluggy Webhook] Detectada movimentação de transações para:', itemIdForSync);
        // Aqui podemos disparar uma tarefa de sincronização interna
        // Por agora, apenas atualizamos o timestamp da última atualização
        await supabase
          .from('open_finance_connections')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('item_id', itemIdForSync);
        break;

      default:
        console.log('[Pluggy Webhook] Evento ignorado:', event);
    }

    return NextResponse.json({ success: true, event });
    
  } catch (error: any) {
    console.error('[Pluggy Webhook] Erro fatal no processamento:', error);
    return NextResponse.json({ error: 'Erro interno no processamento do webhook', details: error.message }, { status: 500 });
  }
}
