import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { followups, leads, appointments } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { syncCalendlyRecent } from '@/lib/calendly';

export default async function InboxPage() {
  const session = await getSession();
  if (!session) return <div className="p-6">Not signed in. <a className="underline" href="/login">Login</a></div>;

  // Just-in-time Calendly sync so the inbox doesn't nag you about someone who already booked.
  try {
    await syncCalendlyRecent();
  } catch {}

  const now = Date.now();
  const items: Array<{ f: typeof followups.$inferSelect; l: typeof leads.$inferSelect | null }> = db.select({ f: followups, l: leads }).from(followups)
    .leftJoin(leads, eq(followups.leadId, leads.id))
    .where(sql`${followups.status} = 'pending' AND ${followups.dueAt} <= ${now}`)
    .orderBy(sql`${followups.dueAt} asc`).all();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <div className="text-sm text-slate-600">Due follow-ups. If someone booked on Calendly, they’ll disappear automatically.</div>
      </div>
      {items.length === 0 ? (
        <div className="card p-6">
          <div className="font-medium">You’re caught up.</div>
          <div className="text-sm text-slate-600 mt-1">No follow-ups due right now.</div>
        </div>
      ) : null}
      <ul className="space-y-2">
        {items.map(({ f, l }) => (
          <li key={f.id} className="card p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">
                <a className="hover:underline" href={l?.id ? `/leads/${l.id}` : '#'}>{l?.name || 'Lead'}</a>
                <span className="ml-2 text-xs text-slate-500">{l?.email || l?.phone}</span>
              </div>
              <div className="text-sm text-slate-600 mt-0.5">
                <span className="badge mr-2">{String(f.type).toUpperCase()}</span>
                Due {new Date(f.dueAt!).toLocaleString()}
              </div>
            </div>
            <form action={`/api/followups/${f.id}/complete`} method="post">
              <button className="btn" type="submit">Mark done</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
