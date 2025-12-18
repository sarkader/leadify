import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { activities } from '@/db/schema';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const form = await req.formData();
  const type = String(form.get('type') || 'call');
  const notes = String(form.get('notes') || '');
  db.insert(activities).values({ leadId: Number(id), type, notes }).run();
  return NextResponse.redirect(new URL(`/leads/${id}`, req.url));
}
