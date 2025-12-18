import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { activities } from '@/db/schema';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData();
  const type = String(form.get('type') || 'call');
  const notes = String(form.get('notes') || '');
  db.insert(activities).values({ leadId: Number(params.id), type, notes }).run();
  return NextResponse.redirect(new URL(`/leads/${params.id}`, req.url));
}
