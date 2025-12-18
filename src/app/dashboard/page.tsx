import { getSession } from '@/lib/auth';
import Link from 'next/link';
import { db } from '@/db';
import { leads, activities, appointments } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    return (
      <div className="p-6">Not signed in. <a className="underline" href="/login">Login</a></div>
    );
  }

  const totalLeads = db.select({ c: sql<number>`count(*)` }).from(leads).get()?.c || 0;
  const totalActivities = db.select({ c: sql<number>`count(*)` }).from(activities).get()?.c || 0;
  const upcoming = db.select().from(appointments).all().slice(0,5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <form action="/api/logout" method="post"><button className="text-sm underline">Logout</button></form>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="border p-4 rounded"><div className="text-sm text-gray-500">Leads</div><div className="text-2xl font-bold">{totalLeads}</div></div>
        <div className="border p-4 rounded"><div className="text-sm text-gray-500">Activities</div><div className="text-2xl font-bold">{totalActivities}</div></div>
        <div className="border p-4 rounded"><div className="text-sm text-gray-500">Upcoming</div><div className="text-2xl font-bold">{upcoming.length}</div></div>
      </div>
      <div>
        <Link className="underline" href="/leads">Go to Leads →</Link>
      </div>
    </div>
  );
}
