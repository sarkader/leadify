"use client";
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      window.location.href = '/dashboard';
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 card p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Login</h1>
          <div className="text-sm text-slate-600">Sign in to manage leads, follow-ups, and bookings.</div>
        </div>
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input className="w-full border border-slate-200 rounded-md p-2 bg-white" value={username} onChange={e=>setUsername(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Passcode</label>
          <input type="password" className="w-full border border-slate-200 rounded-md p-2 bg-white" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button disabled={loading} className="btn btn-primary w-full disabled:opacity-50">{loading? 'Signing in…':'Sign in'}</button>
      </form>
    </div>
  );
}