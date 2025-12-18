import { db } from '@/db';
import { appointments, followups, leads } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { getSetting } from './settings';

const API = 'https://api.calendly.com';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizePhone(phone: string): string {
  // Keep digits only; compare on last 10 digits to handle country codes.
  const digits = phone.replace(/[^\d]/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function extractPhoneFromInvitee(inv: unknown): string | null {
  if (!inv || typeof inv !== 'object') return null;
  const anyInv = inv as {
    phone_number?: string;
    questions_and_answers?: Array<{ answer?: string }>;
  };

  if (typeof anyInv.phone_number === 'string' && anyInv.phone_number.trim()) return anyInv.phone_number.trim();

  const qna = Array.isArray(anyInv.questions_and_answers) ? anyInv.questions_and_answers : [];
  for (const qa of qna) {
    const answer = typeof qa?.answer === 'string' ? qa.answer : '';
    const digits = answer.replace(/[^\d]/g, '');
    if (digits.length >= 10) return answer.trim();
  }
  return null;
}

async function fetchJSON(url: string, init: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

function findLeadByPhoneOrName(input: { phone?: string | null; name?: string | null }) {
  const phoneNorm = input.phone ? normalizePhone(input.phone) : null;
  const nameNorm = input.name ? normalizeName(input.name) : null;

  if (!phoneNorm && !nameNorm) return null;

  // Small datasets: pull and match in-memory (avoid fragile SQL phone normalization).
  const all: Array<{
    id: number;
    name: string;
    phone: string | null;
    waNumber: string | null;
    email: string | null;
  }> = db
    .select({
      id: leads.id,
      name: leads.name,
      phone: leads.phone,
      waNumber: leads.waNumber,
      email: leads.email,
    })
    .from(leads)
    .all();

  if (phoneNorm) {
    const byPhone = all.find((l) => {
      const p = l.phone ? normalizePhone(l.phone) : null;
      const w = l.waNumber ? normalizePhone(l.waNumber) : null;
      return (p && p === phoneNorm) || (w && w === phoneNorm);
    });
    if (byPhone) return byPhone;
  }

  if (nameNorm) {
    const matches = all.filter((l) => normalizeName(l.name) === nameNorm);
    if (matches.length === 1) return matches[0];
  }

  return null;
}

function completePendingFollowups(leadId: number) {
  db.update(followups)
    .set({ status: 'done' })
    .where(and(eq(followups.leadId, leadId), eq(followups.status, 'pending')))
    .run();
}

export async function syncCalendlyRecent(): Promise<{ upserted: number; matchedLeads: number }> {
  const token = getSetting('calendly_token') || process.env.CALENDLY_TOKEN;
  if (!token) return { upserted: 0, matchedLeads: 0 };

  const headers = { Authorization: `Bearer ${token}` } as const;
  const me = await fetchJSON(`${API}/users/me`, { headers });
  const userUri = me?.resource?.uri;
  if (!userUri) return { upserted: 0, matchedLeads: 0 };

  const events = await fetchJSON(
    `${API}/scheduled_events?user=${encodeURIComponent(userUri)}&count=100&sort=start_time:desc`,
    { headers },
  );

  const items: Array<any> = Array.isArray(events?.collection) ? events.collection : [];
  let upserted = 0;
  let matchedLeads = 0;

  for (const ev of items) {
    const evUri: string = typeof ev?.uri === 'string' ? ev.uri : '';
    if (!evUri) continue;
    const uuid: string = typeof ev?.uuid === 'string' ? ev.uuid : '';
    const startMs = ev?.start_time ? Date.parse(ev.start_time) : null;

    const invitees = uuid
      ? await fetchJSON(`${API}/scheduled_events/${uuid}/invitees`, { headers })
      : null;
    const inv = invitees?.collection?.[0];
    const email = typeof inv?.email === 'string' ? normalizeEmail(inv.email) : null;
    const name = typeof inv?.name === 'string' ? inv.name : null;
    const phone = extractPhoneFromInvitee(inv);

    let lead =
      (email ? db.select().from(leads).where(sql`lower(${leads.email}) = ${email}`).get() : null) ??
      findLeadByPhoneOrName({ phone, name });

    if (!lead && (email || name)) {
      const res = db
        .insert(leads)
        .values({ name: name || 'Lead', email, phone: phone || null, source: 'calendly', stage: 'Set' })
        .run();
      lead = db.select().from(leads).where(eq(leads.id, Number(res.lastInsertRowid))).get();
    }

    if (!lead) continue;
    matchedLeads++;

    // Keep lead stage aligned with booking.
    db.update(leads).set({ stage: 'Set' }).where(eq(leads.id, lead.id!)).run();
    completePendingFollowups(lead.id!);

    const existing = db.select().from(appointments).where(eq(appointments.calendlyId, evUri)).get();
    if (existing) continue;

    db.insert(appointments)
      .values({
        leadId: lead.id!,
        calendlyId: evUri,
        start: startMs ? Math.floor(startMs) : null,
        status: 'Scheduled',
      })
      .run();
    upserted++;
  }

  return { upserted, matchedLeads };
}


