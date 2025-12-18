import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
import { syncCalendlyRecent } from '@/lib/calendly';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = getSetting('calendly_token') || process.env.CALENDLY_TOKEN;
  if (!token) return NextResponse.json({ error: 'Missing CALENDLY_TOKEN. Please add it in Admin Settings.' }, { status: 400 });

  try {
    const result = await syncCalendlyRecent();
    return NextResponse.json({
      ok: true,
      ...result,
      message: `Synced ${result.upserted} appointments and matched ${result.matchedLeads} leads`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to sync Calendly' }, { status: 500 });
  }
}

