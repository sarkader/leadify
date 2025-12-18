import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { syncGoogleCalendar } from '@/lib/google-calendar';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await syncGoogleCalendar();
    if (result.errors.length > 0) {
      return NextResponse.json({ error: result.errors[0], imported: result.imported }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      imported: result.imported,
      message: `Synced ${result.imported} events from Google Calendar`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to sync Google Calendar' }, { status: 500 });
  }
}

