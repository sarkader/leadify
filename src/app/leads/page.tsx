import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { leads } from '@/db/schema';
import { sql } from 'drizzle-orm';
import Link from 'next/link';

async function touchLead(id: number, type: 'wa'|'email') {
  'use server'
  await fetch(`${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/leads/${id}/touch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, followupDays: 1 })
  });
}

export default async function LeadsPage() {
  const session = await getSession();
  if (!session) return <div className="p-6">Not signed in. <a className="underline" href="/login">Login</a></div>;

  const rows: Array<typeof leads.$inferSelect> = db.select().from(leads).orderBy(sql`created_at desc`).all();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <div className="text-sm text-slate-600">Track outreach and follow-ups. Bookings auto-clear reminders.</div>
        </div>
        <a href="/leads/new" className="btn btn-primary">New Lead</a>
      </div>
      <div className="card overflow-hidden">
      <table className="table">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="py-2">Name</th>
            <th>Stage</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Source</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(l => (
            <tr key={l.id}>
              <td className="py-3">
                <Link className="font-medium hover:underline" href={`/leads/${l.id}`}>{l.name}</Link>
                <div className="text-xs text-slate-500">{l.lastContactAt ? `Last touch: ${new Date(l.lastContactAt).toLocaleString()}` : 'No touches yet'}</div>
              </td>
              <td><span className="badge">{l.stage}</span></td>
              <td>{l.phone}</td>
              <td>{l.email}</td>
              <td className="text-slate-600">{l.source}</td>
              <td className="space-x-2 py-2">
                <form action={async ()=>{ await touchLead(l.id!, 'wa'); }} className="inline">
                  <button className="btn" type="submit">WhatsApp sent</button>
                </form>
                <form action={async ()=>{ await touchLead(l.id!, 'email'); }} className="inline">
                  <button className="btn" type="submit">Email sent</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div>
        <Link href="/inbox" className="btn">Go to Inbox</Link>
      </div>
    </div>
  );
}
