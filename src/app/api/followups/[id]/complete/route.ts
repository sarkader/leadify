import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { followups } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  db.update(followups).set({ status: 'done' }).where(eq(followups.id, Number(params.id))).run();
  return NextResponse.redirect(new URL('/inbox', req.url));
}
