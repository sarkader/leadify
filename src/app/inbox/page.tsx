import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { followups, leads, appointments } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export default async function InboxPage() {
  const session = await getSession();
  if (!session) return <div className="p-6">Not signed in. <a className="underline" href="/login">Login</a></div>;

  const now = Date.now();
  const items = db.select({ f: followups, l: leads }).from(followups)
    .leftJoin(leads, eq(followups.leadId, leads.id))
    .where(sql`${followups.status} = 'pending' AND ${followups.dueAt} <= ${now}`)
    .orderBy(sql`${followups.dueAt} asc`).all();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Inbox · Follow-ups</h1>
      <ul className="space-y-2">
        {items.map(({ f, l }) => (
          <li key={f.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{l?.name} <span className="text-xs text-gray-500">{l?.email || l?.phone}</span></div>
              <div className="text-sm text-gray-600">{f.type.toUpperCase()} follow-up due {new Date(f.dueAt!).toLocaleString()}</div>
            </div>
            <form action={`/api/followups/${f.id}/complete`} method="post">
              <button className="border px-3 py-1 rounded">Mark done</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
