import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData();
  const stage = String(form.get('stage') || 'New');
  db.update(leads).set({ stage }).where(eq(leads.id, Number(params.id))).run();
  return NextResponse.redirect(new URL(`/leads/${params.id}`, req.url));
}
