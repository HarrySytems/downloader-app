import { NextResponse } from 'next/server';
import { sendTelegramAlert, extractClientMeta } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    const clientMeta = extractClientMeta(request);
    sendTelegramAlert({
      action: 'VISITA',
      detail: 'Acceso a la página principal',
      ...clientMeta
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
