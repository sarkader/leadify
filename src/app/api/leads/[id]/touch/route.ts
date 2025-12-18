import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, activities, followups, appointments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { syncCalendlyRecent } from '@/lib/calendly';

function addDays(ms: number, days: number) { return ms + days * 24 * 60 * 60 * 1000; }

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  const body = await req.json().catch(()=>({}));
  const type: 'wa' | 'email' | 'call' = body.type || 'wa';
  const followupDays: number = Number(body.followupDays ?? 1);
  const now = Date.now();

  const lead = db.select().from(leads).where(eq(leads.id, id)).get();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  db.insert(activities).values({ leadId: id, type, notes: body.notes || null, timestamp: Math.floor(now) }).run();
  db.update(leads).set({ lastContactMethod: type, lastContactAt: Math.floor(now) }).where(eq(leads.id, id)).run();

  // Try to sync Calendly just-in-time to see if they already booked
  try {
    await syncCalendlyRecent();
  } catch {}

  const appt = db.select().from(appointments).where(eq(appointments.leadId, id)).orderBy(desc(appointments.start)).get();
  if (appt && appt.status !== 'Canceled') {
    return NextResponse.json({ ok: true, appointment: appt });
  }

  const dueAt = addDays(now, followupDays);
  db.insert(followups).values({ leadId: id, type, dueAt: Math.floor(dueAt) }).run();
  return NextResponse.json({ ok: true, dueAt });
}
