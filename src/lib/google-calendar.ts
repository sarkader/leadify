import { getSetting, setSetting } from './settings';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

async function getAccessToken(): Promise<string | null> {
  let accessToken = getSetting('google_access_token');
  const expiry = getSetting('google_token_expiry');
  const refreshToken = getSetting('google_refresh_token');

  // Check if token is expired
  if (expiry && Date.now() >= Number(expiry)) {
    if (!refreshToken) return null;

    // Refresh the token
    const clientId = getSetting('google_client_id') || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = getSetting('google_client_secret') || process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) return null;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await response.json();
      if (response.ok && tokens.access_token) {
        accessToken = tokens.access_token;
        setSetting('google_access_token', tokens.access_token);
        if (tokens.expires_in) {
          setSetting('google_token_expiry', String(Date.now() + (tokens.expires_in * 1000)));
        }
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  return accessToken || null;
}

async function fetchJSON(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  return data;
}

export async function syncGoogleCalendar(): Promise<{ imported: number; errors: string[] }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { imported: 0, errors: ['Not connected to Google Calendar. Please connect in Admin Settings.'] };
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    // Get list of calendars
    const calendarsRes = await fetchJSON(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, { headers });
    const calendars = calendarsRes?.items || [];

    // Get events from primary calendar (or first calendar)
    const primaryCalendar = calendars.find((c: any) => c.primary) || calendars[0];
    if (!primaryCalendar) {
      return { imported: 0, errors: ['No calendars found'] };
    }

    const calendarId = primaryCalendar.id;
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // Next 90 days

    const eventsRes = await fetchJSON(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=250&singleEvents=true&orderBy=startTime`,
      { headers }
    );

    const events = eventsRes?.items || [];
    return { imported: events.length, errors: [] };
  } catch (error: any) {
    return { imported: 0, errors: [error.message || 'Failed to sync Google Calendar'] };
  }
}

