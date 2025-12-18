import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { appointments, leads } from '@/db/schema';
import { sql } from 'drizzle-orm';

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) return <div className="p-6">Not signed in. <a className="underline" href="/login">Login</a></div>;

  const upcoming = db.select({ a: appointments, l: leads }).from(appointments)
    .leftJoin(leads, sql`${appointments.leadId} = ${leads.id}`)
    .orderBy(sql`coalesce(${appointments.start}, 0) asc`).all();

  const groups: Record<string, Array<typeof upcoming[number]>> = {};
  for (const row of upcoming) {
    const ts = row.a.start ? new Date(row.a.start) : null;
    const key = ts ? ts.toISOString().slice(0,10) : 'TBD';
    groups[key] = groups[key] || [];
    groups[key].push(row);
  }

  const days = Object.keys(groups).sort();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <div className="text-sm text-slate-600">Upcoming scheduled meetings pulled from Calendly.</div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {days.map(day => (
          <div key={day} className="card overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-200 font-medium bg-slate-50">{day}</div>
            <ul className="divide-y">
              {groups[day].map(({ a, l }) => (
                <li key={a.id} className="p-3 text-sm">
                  <div className="font-medium">{l?.name || 'Lead'} {a.closerName? `· ${a.closerName}`:''}</div>
                  <div className="text-slate-600 flex items-center gap-2">
                    <span>{a.start? new Date(a.start).toLocaleTimeString(): 'Time TBA'}</span>
                    <span className="text-slate-300">·</span>
                    <span className="badge">{a.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
