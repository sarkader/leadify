import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { syncCalendlyRecent } from '@/lib/calendly';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { upserted, matchedLeads } = await syncCalendlyRecent();
  return NextResponse.json({ ok: true, upserted, matchedLeads });
}
