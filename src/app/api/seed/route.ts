import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, messageTemplates, settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'Missing' }, { status: 400 });
  
  // Check if this specific username already exists
  const existing = db.select().from(users).where(eq(users.username, username)).get();
  if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
  
  // Check if this is the first user (for seeding templates)
  const allUsers = db.select().from(users).all();
  const isFirstUser = allUsers.length === 0;
  
  const passwordHash = await bcrypt.hash(password, 12);
  db.insert(users).values({ username, passwordHash }).run();

  // Only seed templates on first user
  if (isFirstUser) {
    db.insert(messageTemplates).values([
      { key: 'noanswer_d0', title: 'No Answer - Day 0', body: 'As-salamu alaykum {name}, this is {your_name} from Muslim Settify. I just tried calling but could not reach you. Book a quick {duration} call here to review your application and get you started: {calendly}. BarakAllahu feek.' },
      { key: 'noanswer_d2', title: 'No Answer - Day 2', body: 'Salam {name} — just following up on your application. Please choose a time here: {calendly}. We will go through next steps and get you moving. JazakAllahu khayran.' },
    ]).run();

    if (process.env.DEFAULT_TZ) {
      db.insert(settings).values({ key: 'default_timezone', value: process.env.DEFAULT_TZ }).run();
    }
  }

  return NextResponse.json({ ok: true });
}
