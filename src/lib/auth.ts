import { cookies } from 'next/headers';
import { verifySession, SessionPayload } from './jwt';

export async function getSession(): Promise<SessionPayload | null> {
  const cookie = (await cookies()).get('ms_session');
  if (!cookie?.value) return null;
  try {
    return await verifySession(cookie.value);
  } catch {
    return null;
  }
}
