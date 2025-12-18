"use client";
import { useState } from 'react';

export default function NewLeadPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: '', timezone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(form) });
    if (res.ok) window.location.href = '/leads';
    else setError('Failed');
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">New Lead</h1>
      <form onSubmit={submit} className="space-y-3">
        {['name','phone','email','source','timezone'].map((k) => (
          <div key={k}>
            <label className="block text-sm mb-1 capitalize">{k}</label>
            <input className="w-full border rounded p-2" value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})} required={k==='name'} />
          </div>
        ))}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button disabled={loading} className="bg-black text-white px-4 py-2 rounded">{loading? 'Saving…':'Save'}</button>
      </form>
    </div>
  );
}
