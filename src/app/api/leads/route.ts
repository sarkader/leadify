import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads } from '@/db/schema';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email =
    typeof body.email === 'string' && body.email.trim()
      ? body.email.trim().toLowerCase()
      : null;
  const result = db.insert(leads).values({
    name: body.name,
    phone: body.phone || null,
    email,
    source: body.source || null,
    timezone: body.timezone || null,
  }).run();
  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}
