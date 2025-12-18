import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
import { db } from '@/db';
import { leads } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

const BASE = 'https://api.close.com/api/v1';

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = getSetting('close_api_key') || process.env.CLOSE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Missing CLOSE_API_KEY. Please add it in Admin Settings.' }, { status: 400 });

  let next: string | null = `${BASE}/lead/?_fields=id,display_name,emails,phones,timezone,source`;
  let imported = 0;
  let updated = 0;

  try {
    while (next) {
      const data = await fetchJSON(next, { headers: { Authorization: `Bearer ${apiKey}` } });
      const results = data?.data || data?.results || [];
      for (const r of results) {
        const email = Array.isArray(r.emails) && r.emails[0]?.email ? r.emails[0].email.toLowerCase().trim() : null;
        const phone = Array.isArray(r.phones) && r.phones[0]?.phone ? r.phones[0].phone : null;
        const name = r.display_name || 'Lead';
        const externalId = r.id || null;

        if (email) {
          const existing = db.select().from(leads).where(sql`lower(${leads.email}) = ${email}`).get();
          if (existing) {
            db.update(leads)
              .set({ name, phone, timezone: r.timezone || null, source: r.source || 'close', externalId })
              .where(eq(leads.id, existing.id!))
              .run();
            updated++;
          } else {
            db.insert(leads)
              .values({ name, email, phone, timezone: r.timezone || null, source: 'close', externalId })
              .run();
            imported++;
          }
        } else if (externalId) {
          const existing = db.select().from(leads).where(eq(leads.externalId, externalId)).get();
          if (!existing) {
            db.insert(leads).values({ name, phone, timezone: r.timezone || null, source: 'close', externalId }).run();
            imported++;
          }
        }
      }
      next = data?.has_more && data?.next ? `${BASE}${data.next}` : null;
      if (!data?.has_more && data?._has_more) next = null;
    }

    return NextResponse.json({ ok: true, imported, updated, message: `Imported ${imported} new leads, updated ${updated} existing leads` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to sync Close CRM' }, { status: 500 });
  }
}

