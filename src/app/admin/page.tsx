import { getSession } from '@/lib/auth';

async function action(path: string) {
  'use server'
  await fetch(`${process.env.APP_BASE_URL || 'http://localhost:3000'}${path}`, { method: 'POST' });
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session) return <div className="p-6">Not signed in. <a className="underline" href="/login">Login</a></div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="space-x-2">
        <form action={async ()=>{ await action('/api/integrations/close/pull'); }}><button className="border px-3 py-1 rounded">Pull Close Leads</button></form>
        <form action={async ()=>{ await action('/api/integrations/calendly/pull'); }}><button className="border px-3 py-1 rounded">Pull Calendly</button></form>
      </div>
      <div className="text-sm text-slate-600">Use these to refresh data until webhooks are live.</div>
    </div>
  );
}
