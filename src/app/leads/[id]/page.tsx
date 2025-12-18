import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { leads, activities, appointments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function LeadDetail({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return <div className="p-6">Not signed in. <a className="underline" href="/login">Login</a></div>;

  const lead = db.select().from(leads).where(eq(leads.id, Number(params.id))).get();
  if (!lead) return <div className="p-6">Lead not found</div>;
  const acts = db.select().from(activities).where(eq(activities.leadId, lead.id!)).orderBy(desc(activities.timestamp)).all();
  const appts = db.select().from(appointments).where(eq(appointments.leadId, lead.id!)).all();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{lead.name}</h1>
          <div className="text-sm text-gray-600">{lead.email} · {lead.phone} · {lead.timezone}</div>
        </div>
        <form action={`/api/leads/${lead.id}/stage`} method="post" className="flex items-center gap-2">
          <select name="stage" defaultValue={lead.stage} className="border rounded p-1">
            {['New','Attempting','Connected','Qualified','Set','Show','No-Show','Reschedule','Closed Won','Closed Lost','Nurture','DNC'].map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="border px-3 py-1 rounded">Update</button>
        </form>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">Add Activity</h2>
        <form action={`/api/leads/${lead.id}/activities`} method="post" className="flex gap-2">
          <select name="type" className="border rounded p-1">
            {['call','wa','email','meeting'].map(t=> <option key={t} value={t}>{t}</option>)}
          </select>
          <input name="notes" placeholder="notes" className="flex-1 border rounded p-1" />
          <button className="border px-3 py-1 rounded">Add</button>
        </form>
        <div className="text-sm text-gray-600">Logging activities keeps your metrics accurate.</div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Activities</h2>
        <ul className="space-y-1 text-sm">
          {acts.map(a=> (
            <li key={a.id} className="border rounded p-2">[{a.type}] {a.notes} — {new Date(a.timestamp!).toLocaleString()}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Appointments</h2>
        <ul className="space-y-1 text-sm">
          {appts.map(a=> (
            <li key={a.id} className="border rounded p-2">{a.status} — {a.start? new Date(a.start).toLocaleString(): 'TBD'} {a.closerName? `· ${a.closerName}`:''}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
