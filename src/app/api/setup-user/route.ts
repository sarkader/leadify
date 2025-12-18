import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });

  // Check if user already exists
  const existing = db.select().from(users).where(eq(users.username, username)).get();
  if (existing) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }

  // Create the user
  const passwordHash = await bcrypt.hash(password, 12);
  db.insert(users).values({ username, passwordHash }).run();

  return NextResponse.json({ ok: true, message: 'User created successfully' });
}

