"use client";
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [calendlyToken, setCalendlyToken] = useState('');
  const [closeApiKey, setCloseApiKey] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Load existing API keys
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.calendlyToken) setCalendlyToken(data.calendlyToken);
        if (data.closeApiKey) setCloseApiKey(data.closeApiKey);
        if (data.googleClientId) setGoogleClientId(data.googleClientId);
        if (data.googleClientSecret) setGoogleClientSecret(data.googleClientSecret);
        if (data.googleConnected) setGoogleConnected(data.googleConnected);
      })
      .catch(() => {});

    // Check URL params for OAuth callback messages
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === '1') {
      setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
      setGoogleConnected(true);
      window.history.replaceState({}, '', '/admin');
    }
    if (params.get('google_error')) {
      setMessage({ type: 'error', text: `Google connection failed: ${params.get('google_error')}` });
      window.history.replaceState({}, '', '/admin');
    }
  }, []);

  const saveSettings = async () => {
    setLoading({ save: true });
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendlyToken, closeApiKey, googleClientId, googleClientSecret }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading({ save: false });
    }
  };

  const runAction = async (action: string) => {
    setLoading({ [action]: true });
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/${action}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || `${action} completed successfully` });
      } else {
        setMessage({ type: 'error', text: data.error || `${action} failed` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `${action} failed` });
    } finally {
      setLoading({ [action]: false });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Settings</h1>
        <div className="text-sm text-slate-600 mt-1">Manage integrations and sync data</div>
      </div>

      {message && (
        <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">API Keys & Credentials</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Calendly Personal Access Token</label>
            <input
              type="password"
              className="w-full border border-slate-200 rounded-md p-2 bg-white"
              value={calendlyToken}
              onChange={e => setCalendlyToken(e.target.value)}
              placeholder="Enter Calendly token"
            />
            <div className="text-xs text-slate-500 mt-1">
              Get this from Calendly → Settings → Integrations → API & Webhooks
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Close CRM API Key</label>
            <input
              type="password"
              className="w-full border border-slate-200 rounded-md p-2 bg-white"
              value={closeApiKey}
              onChange={e => setCloseApiKey(e.target.value)}
              placeholder="Enter Close API key"
            />
            <div className="text-xs text-slate-500 mt-1">
              Get this from Close → Settings → API Keys
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Google Calendar Client ID</label>
            <input
              type="text"
              className="w-full border border-slate-200 rounded-md p-2 bg-white"
              value={googleClientId}
              onChange={e => setGoogleClientId(e.target.value)}
              placeholder="Enter Google OAuth Client ID"
            />
            <div className="text-xs text-slate-500 mt-1">
              From Google Cloud Console → APIs & Services → Credentials
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Google Calendar Client Secret</label>
            <input
              type="password"
              className="w-full border border-slate-200 rounded-md p-2 bg-white"
              value={googleClientSecret}
              onChange={e => setGoogleClientSecret(e.target.value)}
              placeholder="Enter Google OAuth Client Secret"
            />
            <div className="text-xs text-slate-500 mt-1">
              From Google Cloud Console → APIs & Services → Credentials
            </div>
          </div>

          {googleConnected && (
            <div className="p-3 bg-green-50 text-green-800 rounded-md text-sm">
              ✓ Google Calendar is connected
            </div>
          )}

          <button
            onClick={saveSettings}
            disabled={loading.save}
            className="btn btn-primary"
          >
            {loading.save ? 'Saving...' : 'Save API Keys'}
          </button>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Data Sync</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => runAction('sync-close')}
            disabled={loading['sync-close']}
            className="btn btn-secondary"
          >
            {loading['sync-close'] ? 'Syncing...' : 'Sync Close CRM Leads'}
          </button>

          <button
            onClick={() => runAction('sync-calendly')}
            disabled={loading['sync-calendly']}
            className="btn btn-secondary"
          >
            {loading['sync-calendly'] ? 'Syncing...' : 'Sync Calendly Appointments'}
          </button>

          <button
            onClick={() => runAction('setup-calendly-webhook')}
            disabled={loading['setup-calendly-webhook']}
            className="btn btn-secondary"
          >
            {loading['setup-calendly-webhook'] ? 'Setting up...' : 'Setup Calendly Webhook'}
          </button>

          <button
            onClick={() => {
              if (googleClientId && googleClientSecret) {
                window.location.href = '/api/admin/connect-google';
              } else {
                setMessage({ type: 'error', text: 'Please save Google Client ID and Secret first' });
              }
            }}
            disabled={loading['connect-google'] || !googleClientId || !googleClientSecret}
            className="btn btn-secondary"
          >
            {loading['connect-google'] ? 'Connecting...' : googleConnected ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}
          </button>

          <button
            onClick={() => runAction('sync-google')}
            disabled={loading['sync-google'] || !googleConnected}
            className="btn btn-secondary"
          >
            {loading['sync-google'] ? 'Syncing...' : 'Sync Google Calendar'}
          </button>
        </div>
        <div className="text-sm text-slate-600">
          Use these buttons to manually sync data or set up webhooks for real-time updates.
        </div>
      </section>
    </div>
  );
}
