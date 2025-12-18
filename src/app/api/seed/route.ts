import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, messageTemplates, settings } from '@/db/schema';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'Missing' }, { status: 400 });
  const existing = db.select().from(users).all();
  if (existing.length > 0) return NextResponse.json({ error: 'Already seeded' }, { status: 400 });
  const passwordHash = await bcrypt.hash(password, 12);
  db.insert(users).values({ username, passwordHash }).run();

  db.insert(messageTemplates).values([
    { key: 'noanswer_d0', title: 'No Answer - Day 0', body: 'As-salamu alaykum {name}, this is {your_name} from Muslim Settify. I just tried calling but couldn’t reach you. Book a quick {duration} call here to review your application and get you started: {calendly}. BarakAllahu feek.' },
    { key: 'noanswer_d2', title: 'No Answer - Day 2', body: 'Salam {name} — just following up on your application. Please choose a time here: {calendly}. We’ll go through next steps and get you moving. JazakAllahu khayran.' },
  ]).run();

  if (process.env.DEFAULT_TZ) {
    db.insert(settings).values({ key: 'default_timezone', value: process.env.DEFAULT_TZ }).run();
  }

  return NextResponse.json({ ok: true });
}
