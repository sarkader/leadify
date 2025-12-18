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

  const rows = db.select().from(leads).orderBy(sql`created_at desc`).all();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <a href="/leads/new" className="border px-3 py-1 rounded">New Lead</a>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
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
            <tr key={l.id} className="border-b hover:bg-gray-50">
              <td className="py-2"><Link className="underline" href={`/leads/${l.id}`}>{l.name}</Link></td>
              <td>{l.stage}</td>
              <td>{l.phone}</td>
              <td>{l.email}</td>
              <td>{l.source}</td>
              <td className="space-x-2 py-2">
                <form action={async ()=>{ await touchLead(l.id!, 'wa'); }}><button className="border px-2 py-1 rounded">WhatsApp sent</button></form>
                <form action={async ()=>{ await touchLead(l.id!, 'email'); }}><button className="border px-2 py-1 rounded">Email sent</button></form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <Link href="/inbox" className="underline">Go to Inbox (Follow-ups)</Link>
      </div>
    </div>
  );
}
